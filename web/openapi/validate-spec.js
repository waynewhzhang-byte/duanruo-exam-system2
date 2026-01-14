#!/usr/bin/env node
/**
 * OpenAPI Specification Validation Script
 *
 * Validates the exported OpenAPI spec for:
 * 1. ErrorResponse schema existence
 * 2. Standard error responses (400, 401, 403, 500)
 * 3. Permission metadata in endpoints
 * 4. Required fields in schemas
 */

const fs = require('fs');
const path = require('path');

// Load the OpenAPI spec
const specPath = path.join(__dirname, 'exam-system-api.json');
const spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));

console.log('='.repeat(80));
console.log('OpenAPI Specification Validation Report');
console.log('='.repeat(80));
console.log();

let errors = 0;
let warnings = 0;

// Check 1: ErrorResponse schema
console.log('✓ Checking ErrorResponse schema...');
if (spec.components?.schemas?.ErrorResponse) {
  const errorResponse = spec.components.schemas.ErrorResponse;
  console.log('  ✓ ErrorResponse schema found');

  const requiredFields = ['errorCode', 'message', 'timestamp'];
  const missingFields = requiredFields.filter(
    field => !errorResponse.properties?.[field]
  );

  if (missingFields.length > 0) {
    console.log(`  ✗ Missing required fields: ${missingFields.join(', ')}`);
    errors++;
  } else {
    console.log('  ✓ All required fields present');
  }
} else {
  console.log('  ✗ ErrorResponse schema NOT found');
  errors++;
}
console.log();

// Check 2: Standard error responses
console.log('✓ Checking standard error responses...');
const requiredResponses = {
  'BadRequest': '400',
  'Unauthorized': '401',
  'Forbidden': '403',
  'InternalServerError': '500'
};

Object.entries(requiredResponses).forEach(([name, code]) => {
  if (spec.components?.responses?.[name]) {
    console.log(`  ✓ ${name} (${code}) response found`);
  } else {
    console.log(`  ✗ ${name} (${code}) response NOT found`);
    errors++;
  }
});
console.log();

// Check 3: Count endpoints with error responses
console.log('✓ Checking endpoint error response coverage...');
let totalEndpoints = 0;
let endpointsWithErrors = 0;
let endpointsWithAuth = 0;
let endpointsWithForbidden = 0;

Object.entries(spec.paths || {}).forEach(([path, methods]) => {
  Object.entries(methods).forEach(([method, operation]) => {
    if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
      totalEndpoints++;

      const responses = operation.responses || {};

      // Check for error responses
      if (responses['400'] || responses['401'] || responses['500']) {
        endpointsWithErrors++;
      }

      // Check for auth-related responses
      if (responses['401']) {
        endpointsWithAuth++;
      }

      // Check for 403 on secured endpoints
      if (operation.security || operation['x-permissions']) {
        if (responses['403']) {
          endpointsWithForbidden++;
        }
      }
    }
  });
});

console.log(`  Total endpoints: ${totalEndpoints}`);
console.log(`  Endpoints with error responses: ${endpointsWithErrors} (${((endpointsWithErrors/totalEndpoints)*100).toFixed(1)}%)`);
console.log(`  Endpoints with 401: ${endpointsWithAuth} (${((endpointsWithAuth/totalEndpoints)*100).toFixed(1)}%)`);

if (endpointsWithErrors < totalEndpoints) {
  console.log(`  ⚠ Warning: ${totalEndpoints - endpointsWithErrors} endpoints missing error responses`);
  warnings++;
}
console.log();

// Check 4: Permission metadata
console.log('✓ Checking permission metadata...');
let endpointsWithPermissions = 0;

Object.entries(spec.paths || {}).forEach(([path, methods]) => {
  Object.entries(methods).forEach(([method, operation]) => {
    if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
      if (operation['x-permissions'] || operation.security) {
        endpointsWithPermissions++;
      }
    }
  });
});

console.log(`  Secured endpoints: ${endpointsWithPermissions} (${((endpointsWithPermissions/totalEndpoints)*100).toFixed(1)}%)`);

if (endpointsWithPermissions < totalEndpoints * 0.5) {
  console.log('  ⚠ Warning: Less than 50% of endpoints have security metadata');
  warnings++;
}
console.log();

// Check 5: Schema completeness
console.log('✓ Checking schema definitions...');
const schemaCount = Object.keys(spec.components?.schemas || {}).length;
console.log(`  Total schemas: ${schemaCount}`);

if (schemaCount === 0) {
  console.log('  ✗ No schemas found');
  errors++;
} else {
  console.log('  ✓ Schemas defined');
}
console.log();

// Summary
console.log('='.repeat(80));
console.log('Validation Summary');
console.log('='.repeat(80));
console.log(`Errors:   ${errors}`);
console.log(`Warnings: ${warnings}`);
console.log();

if (errors === 0 && warnings === 0) {
  console.log('✓ OpenAPI specification is valid and complete!');
  process.exit(0);
} else if (errors === 0) {
  console.log('✓ OpenAPI specification is valid (with warnings)');
  process.exit(0);
} else {
  console.log('✗ OpenAPI specification has errors that need to be fixed');
  process.exit(1);
}
