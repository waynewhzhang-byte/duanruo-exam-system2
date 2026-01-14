#!/bin/bash
# Export OpenAPI specification from running backend

# Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:8080}"
OUTPUT_DIR="${OUTPUT_DIR:-./web/openapi}"
OUTPUT_FILE="${OUTPUT_FILE:-exam-system-api.json}"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Export OpenAPI JSON
echo "📥 Exporting OpenAPI specification from ${API_BASE_URL}..."
curl -s "${API_BASE_URL}/v3/api-docs" \
  -H "Accept: application/json" \
  -o "${OUTPUT_DIR}/${OUTPUT_FILE}"

if [ $? -eq 0 ]; then
  echo "✅ OpenAPI exported successfully to ${OUTPUT_DIR}/${OUTPUT_FILE}"
  
  # Pretty print JSON
  if command -v jq &> /dev/null; then
    jq . "${OUTPUT_DIR}/${OUTPUT_FILE}" > "${OUTPUT_DIR}/${OUTPUT_FILE}.tmp"
    mv "${OUTPUT_DIR}/${OUTPUT_FILE}.tmp" "${OUTPUT_DIR}/${OUTPUT_FILE}"
    echo "✅ JSON formatted"
  fi
  
  # Show statistics
  if command -v jq &> /dev/null; then
    TOTAL_PATHS=$(jq '.paths | length' "${OUTPUT_DIR}/${OUTPUT_FILE}")
    echo "📊 Total API endpoints: ${TOTAL_PATHS}"
  fi
else
  echo "❌ Failed to export OpenAPI specification"
  echo "   Make sure the backend is running at ${API_BASE_URL}"
  exit 1
fi
