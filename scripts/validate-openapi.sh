#!/bin/bash
# Validate OpenAPI specification

# Configuration
OPENAPI_FILE="${OPENAPI_FILE:-./web/openapi/exam-system-api.json}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Validating OpenAPI specification: ${OPENAPI_FILE}"
echo "=================================================="

# 1. Check if file exists
if [ ! -f "$OPENAPI_FILE" ]; then
  echo -e "${RED}❌ Error: OpenAPI file not found${NC}"
  echo "   Please run export-openapi.sh first"
  exit 1
fi

# 2. Validate JSON format
if ! jq empty "$OPENAPI_FILE" 2>/dev/null; then
  echo -e "${RED}❌ Error: Invalid JSON format${NC}"
  exit 1
fi
echo -e "${GREEN}✅ JSON format valid${NC}"

# 3. Validate OpenAPI version
OPENAPI_VERSION=$(jq -r '.openapi' "$OPENAPI_FILE")
if [ "$OPENAPI_VERSION" != "3.0.1" ] && [ "$OPENAPI_VERSION" != "3.1.0" ]; then
  echo -e "${YELLOW}⚠️  Warning: Unexpected OpenAPI version: ${OPENAPI_VERSION}${NC}"
else
  echo -e "${GREEN}✅ OpenAPI version: ${OPENAPI_VERSION}${NC}"
fi

# 4. Count total endpoints
TOTAL_PATHS=$(jq '.paths | length' "$OPENAPI_FILE")
echo -e "${GREEN}✅ Total API endpoints: ${TOTAL_PATHS}${NC}"

# 5. Count endpoints with permissions
ENDPOINTS_WITH_PERMS=$(jq '[.paths[].*["x-permissions"]] | flatten | length' "$OPENAPI_FILE")
echo -e "${GREEN}✅ Endpoints with permissions: ${ENDPOINTS_WITH_PERMS}${NC}"

# 6. Check for hasRole() usage (should be migrated)
ROLE_COUNT=$(jq '[.paths[].*["x-auth-expression"]? | select(. != null) | select(contains("hasRole"))] | length' "$OPENAPI_FILE")
if [ "$ROLE_COUNT" -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Warning: ${ROLE_COUNT} endpoints still use hasRole()${NC}"
  echo "   These should be migrated to hasAuthority()"
  
  # List affected endpoints
  echo "   Affected endpoints:"
  jq -r '.paths | to_entries[] | .key as $path | .value | to_entries[] | select(.value["x-auth-expression"]? | contains("hasRole")) | "   - \($path) [\(.key | ascii_upcase)]"' "$OPENAPI_FILE"
else
  echo -e "${GREEN}✅ No hasRole() usage found${NC}"
fi

# 7. Validate error responses
ENDPOINTS_WITH_400=$(jq '[.paths[].*.responses["400"]] | length' "$OPENAPI_FILE")
ENDPOINTS_WITH_401=$(jq '[.paths[].*.responses["401"]] | length' "$OPENAPI_FILE")
ENDPOINTS_WITH_500=$(jq '[.paths[].*.responses["500"]] | length' "$OPENAPI_FILE")

echo -e "${GREEN}✅ Error responses configured:${NC}"
echo "   - 400 Bad Request: ${ENDPOINTS_WITH_400} endpoints"
echo "   - 401 Unauthorized: ${ENDPOINTS_WITH_401} endpoints"
echo "   - 500 Internal Server Error: ${ENDPOINTS_WITH_500} endpoints"

# 8. List all unique permissions
echo ""
echo "📋 Unique permissions used:"
jq -r '[.paths[].*["x-permissions"][]?] | unique | .[]' "$OPENAPI_FILE" | sort | sed 's/^/   - /'

# 9. Check for required components
if jq -e '.components.schemas.ErrorResponse' "$OPENAPI_FILE" > /dev/null; then
  echo -e "${GREEN}✅ ErrorResponse schema defined${NC}"
else
  echo -e "${RED}❌ ErrorResponse schema missing${NC}"
fi

if jq -e '.components.responses.BadRequest' "$OPENAPI_FILE" > /dev/null; then
  echo -e "${GREEN}✅ Standard error responses defined${NC}"
else
  echo -e "${RED}❌ Standard error responses missing${NC}"
fi

# 10. Final summary
echo ""
echo "=================================================="
if [ "$ROLE_COUNT" -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Validation completed with warnings${NC}"
  exit 1
else
  echo -e "${GREEN}✅ Validation passed successfully${NC}"
  exit 0
fi
