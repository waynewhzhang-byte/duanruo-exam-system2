# Form Builder Implementation Plan

**Feature**: PRD §5.4 报名表单构建器 (Form Builder)
**Priority**: P0 (Critical)
**Current Coverage**: 20% (Only JSON storage implemented)
**Target Coverage**: 100%

## 1. Requirements Analysis (PRD §5.4)

### Current Implementation (20%)
✅ Basic JSON schema storage (`Exam.formTemplate`)
✅ Single endpoint: `PUT /exams/{id}/form-template` (updates entire JSON)

### Missing Functionality (80%)

#### 1.1 Visual Form Builder API
- ❌ Field type management (text, number, select, multi-select, file upload, date, phone, address)
- ❌ Field metadata (label, placeholder, help text, validation rules)
- ❌ Field ordering and grouping
- ❌ Drag-drop operation support
- ❌ Real-time validation rule configuration

#### 1.2 Field Type Support
Currently only stores generic JSON. Need dedicated endpoints for:
- Text fields (single-line, multi-line)
- Numeric fields (integer, decimal, currency)
- Selection fields (radio, checkbox, dropdown)
- File upload fields (image, PDF, document - with MinIO integration)
- Date/time fields (date, datetime, time range)
- Contact fields (phone, email, address)
- Identity fields (ID card, passport)

#### 1.3 Validation Rules
- ❌ Required/optional field configuration
- ❌ Min/max length
- ❌ Regex pattern validation
- ❌ Custom error messages
- ❌ Cross-field validation (conditional logic)

#### 1.4 Form Template Versioning
- ❌ Version history tracking
- ❌ Rollback capability
- ❌ Change log
- ❌ Migration support (when updating forms with existing applications)

#### 1.5 Conditional Logic
- ❌ Field visibility rules (show/hide based on other fields)
- ❌ Conditional validation
- ❌ Dynamic field options

## 2. Architecture Design

### 2.1 Domain Model

We'll introduce a new aggregate: **FormTemplate**

```
FormTemplate (Aggregate Root)
├── FormTemplateId (Value Object)
├── templateName: String
├── description: String
├── version: Integer
├── status: FormTemplateStatus (DRAFT, PUBLISHED, ARCHIVED)
├── fields: List<FieldDefinition> (Aggregate entities)
├── validationRules: List<ValidationRule> (Value Objects)
├── createdBy: String
├── createdAt: LocalDateTime
└── updatedAt: LocalDateTime

FieldDefinition (Entity within FormTemplate aggregate)
├── FieldId (Value Object)
├── fieldKey: String (unique within form)
├── fieldType: FieldType (TEXT, NUMBER, SELECT, FILE, DATE, etc.)
├── label: String
├── placeholder: String
├── helpText: String
├── required: boolean
├── displayOrder: Integer
├── options: FieldOptions (Value Object - for SELECT types)
├── constraints: FieldConstraints (Value Object)
└── conditionalRules: ConditionalRules (Value Object)

FieldType (Enum)
- TEXT_SHORT (single-line text)
- TEXT_LONG (multi-line textarea)
- NUMBER_INTEGER
- NUMBER_DECIMAL
- SELECT_SINGLE (radio / dropdown)
- SELECT_MULTIPLE (checkbox)
- FILE_IMAGE (证件照)
- FILE_DOCUMENT (身份证, 资格证)
- DATE
- DATETIME
- PHONE
- EMAIL
- ADDRESS
- ID_CARD
- CUSTOM

ValidationRule (Value Object)
├── ruleType: ValidationType (REQUIRED, PATTERN, RANGE, CUSTOM)
├── config: Map<String, Object> (flexible rule configuration)
└── errorMessage: String

ConditionalRules (Value Object)
├── visibilityCondition: Condition (show/hide logic)
└── validationCondition: Condition (conditional validation)
```

### 2.2 Relationship with Exam

**Option A: Separate Aggregate (Recommended)**
- FormTemplate is an independent aggregate
- Exam references FormTemplateId
- Allows form templates to be reused across multiple exams
- Better separation of concerns

**Option B: Keep as Exam property (Current)**
- FormTemplate remains as JSON in Exam.formTemplate
- Simpler for single-use forms
- Less flexible

**Decision**: Implement **Option A** for long-term flexibility, but maintain backward compatibility with existing JSON storage.

### 2.3 Database Schema

#### New Tables (in tenant schema)

```sql
-- Form templates
CREATE TABLE form_templates (
    id UUID PRIMARY KEY,
    template_name VARCHAR(200) NOT NULL,
    description TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL, -- DRAFT, PUBLISHED, ARCHIVED
    form_schema JSONB NOT NULL, -- Full JSON schema for backward compatibility
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Field definitions (for structured access and validation)
CREATE TABLE form_template_fields (
    id UUID PRIMARY KEY,
    form_template_id UUID NOT NULL REFERENCES form_templates(id) ON DELETE CASCADE,
    field_key VARCHAR(100) NOT NULL,
    field_type VARCHAR(50) NOT NULL,
    label VARCHAR(200) NOT NULL,
    placeholder VARCHAR(200),
    help_text TEXT,
    required BOOLEAN NOT NULL DEFAULT false,
    display_order INTEGER NOT NULL,
    options JSONB, -- For SELECT types
    constraints JSONB, -- Validation constraints
    conditional_rules JSONB, -- Conditional logic
    created_at TIMESTAMP NOT NULL,
    UNIQUE(form_template_id, field_key)
);

CREATE INDEX idx_form_template_fields_template ON form_template_fields(form_template_id);
CREATE INDEX idx_form_template_fields_order ON form_template_fields(form_template_id, display_order);

-- Form template versions (for version management)
CREATE TABLE form_template_versions (
    id UUID PRIMARY KEY,
    form_template_id UUID NOT NULL REFERENCES form_templates(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    form_schema JSONB NOT NULL,
    change_description TEXT,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    UNIQUE(form_template_id, version)
);

CREATE INDEX idx_form_template_versions_template ON form_template_versions(form_template_id);

-- Update exams table to reference form templates
ALTER TABLE exams ADD COLUMN form_template_id UUID REFERENCES form_templates(id);
-- Keep form_template column for backward compatibility (mark as deprecated)
```

### 2.4 API Design

#### New REST Endpoints

```
# Form Template Management
POST   /api/v1/form-templates                          # Create new form template
GET    /api/v1/form-templates                          # List form templates
GET    /api/v1/form-templates/{id}                     # Get form template details
PUT    /api/v1/form-templates/{id}                     # Update form template metadata
DELETE /api/v1/form-templates/{id}                     # Delete form template
POST   /api/v1/form-templates/{id}/publish             # Publish form template
POST   /api/v1/form-templates/{id}/archive             # Archive form template

# Field Management (CRUD for form fields)
POST   /api/v1/form-templates/{id}/fields              # Add field to form
GET    /api/v1/form-templates/{id}/fields              # List all fields
GET    /api/v1/form-templates/{id}/fields/{fieldId}    # Get field details
PUT    /api/v1/form-templates/{id}/fields/{fieldId}    # Update field
DELETE /api/v1/form-templates/{id}/fields/{fieldId}    # Delete field
PUT    /api/v1/form-templates/{id}/fields/reorder      # Batch reorder fields

# Field Type Catalog
GET    /api/v1/form-templates/field-types              # List available field types
GET    /api/v1/form-templates/field-types/{type}       # Get field type schema

# Version Management
GET    /api/v1/form-templates/{id}/versions            # List versions
GET    /api/v1/form-templates/{id}/versions/{version}  # Get specific version
POST   /api/v1/form-templates/{id}/versions/{version}/rollback  # Rollback to version

# Validation
POST   /api/v1/form-templates/{id}/validate            # Validate form schema
POST   /api/v1/form-templates/validate-schema          # Validate JSON schema without creating

# Exam Integration (Update existing)
PUT    /api/v1/exams/{id}/form-template                # Associate form template with exam
GET    /api/v1/exams/{id}/form-template                # Get exam's form template
```

## 3. Implementation Steps

### Phase 1: Domain Layer (Priority: P0)

**Tasks:**
1. Create `FormTemplate` aggregate root
   - FormTemplateId value object
   - FormTemplateStatus enum
   - Domain methods: addField(), removeField(), reorderFields(), publish(), archive()

2. Create `FieldDefinition` entity
   - FieldId value object
   - FieldType enum (all field types from PRD)
   - Domain validation logic

3. Create value objects:
   - FieldOptions (for select fields)
   - FieldConstraints (validation constraints)
   - ConditionalRules (conditional logic)
   - ValidationRule

4. Create repository interface:
   - `FormTemplateRepository` in domain layer

**Files to create:**
- `exam-domain/src/main/java/com/duanruo/exam/domain/formtemplate/FormTemplate.java`
- `exam-domain/src/main/java/com/duanruo/exam/domain/formtemplate/FormTemplateId.java`
- `exam-domain/src/main/java/com/duanruo/exam/domain/formtemplate/FormTemplateStatus.java`
- `exam-domain/src/main/java/com/duanruo/exam/domain/formtemplate/FieldDefinition.java`
- `exam-domain/src/main/java/com/duanruo/exam/domain/formtemplate/FieldId.java`
- `exam-domain/src/main/java/com/duanruo/exam/domain/formtemplate/FieldType.java`
- `exam-domain/src/main/java/com/duanruo/exam/domain/formtemplate/FieldOptions.java`
- `exam-domain/src/main/java/com/duanruo/exam/domain/formtemplate/FieldConstraints.java`
- `exam-domain/src/main/java/com/duanruo/exam/domain/formtemplate/ConditionalRules.java`
- `exam-domain/src/main/java/com/duanruo/exam/domain/formtemplate/ValidationRule.java`
- `exam-domain/src/main/java/com/duanruo/exam/domain/formtemplate/FormTemplateRepository.java`

### Phase 2: Infrastructure Layer (Priority: P0)

**Tasks:**
1. Create JPA entities:
   - FormTemplateEntity
   - FormTemplateFieldEntity
   - FormTemplateVersionEntity

2. Create repository implementation:
   - FormTemplateRepositoryImpl (JPA adapter)
   - FormTemplateJpaRepository

3. Create mappers:
   - FormTemplateMapper (JPA entity <-> Domain aggregate)

4. Database migrations:
   - Create Flyway migration scripts for new tables

**Files to create:**
- `exam-infrastructure/src/main/java/com/duanruo/exam/infrastructure/persistence/entity/FormTemplateEntity.java`
- `exam-infrastructure/src/main/java/com/duanruo/exam/infrastructure/persistence/entity/FormTemplateFieldEntity.java`
- `exam-infrastructure/src/main/java/com/duanruo/exam/infrastructure/persistence/entity/FormTemplateVersionEntity.java`
- `exam-infrastructure/src/main/java/com/duanruo/exam/infrastructure/persistence/repository/FormTemplateJpaRepository.java`
- `exam-infrastructure/src/main/java/com/duanruo/exam/infrastructure/persistence/repository/FormTemplateRepositoryImpl.java`
- `exam-infrastructure/src/main/java/com/duanruo/exam/infrastructure/persistence/mapper/FormTemplateMapper.java`
- `exam-infrastructure/src/main/resources/db/tenant-migration/V011__create_form_template_tables.sql`

### Phase 3: Application Layer (Priority: P0)

**Tasks:**
1. Create DTOs:
   - FormTemplateCreateRequest
   - FormTemplateResponse
   - FieldDefinitionRequest
   - FieldDefinitionResponse
   - FieldReorderRequest
   - ValidationRuleDTO

2. Create application service:
   - FormTemplateApplicationService
   - Methods for all CRUD operations + version management

**Files to create:**
- `exam-application/src/main/java/com/duanruo/exam/application/dto/FormTemplateCreateRequest.java`
- `exam-application/src/main/java/com/duanruo/exam/application/dto/FieldDefinitionRequest.java`
- `exam-application/src/main/java/com/duanruo/exam/application/dto/FieldDefinitionResponse.java`
- `exam-application/src/main/java/com/duanruo/exam/application/dto/FieldReorderRequest.java`
- `exam-application/src/main/java/com/duanruo/exam/application/dto/ValidationRuleDTO.java`
- `exam-application/src/main/java/com/duanruo/exam/application/service/FormTemplateApplicationService.java`

### Phase 4: Adapter Layer (Priority: P0)

**Tasks:**
1. Create REST controller:
   - FormTemplateController
   - Implement all endpoints from API design

2. Add OpenAPI documentation:
   - Swagger annotations
   - Example request/response bodies

**Files to create:**
- `exam-adapter-rest/src/main/java/com/duanruo/exam/adapter/rest/controller/FormTemplateController.java`

### Phase 5: Testing (Priority: P0)

**Tasks:**
1. Unit tests for domain logic:
   - FormTemplate aggregate tests
   - FieldDefinition validation tests

2. Integration tests:
   - Repository tests with Testcontainers
   - API endpoint tests

3. E2E tests:
   - Form builder workflow tests

**Files to create:**
- `exam-domain/src/test/java/com/duanruo/exam/domain/formtemplate/FormTemplateTest.java`
- `exam-domain/src/test/java/com/duanruo/exam/domain/formtemplate/FieldDefinitionTest.java`
- `exam-application/src/test/java/com/duanruo/exam/application/service/FormTemplateApplicationServiceTest.java`
- `exam-adapter-rest/src/test/java/com/duanruo/exam/adapter/rest/controller/FormTemplateControllerTest.java`

### Phase 6: Documentation & Migration (Priority: P1)

**Tasks:**
1. Update PRD coverage analysis
2. Create API usage documentation
3. Create migration guide for existing exams using JSON formTemplate
4. Update OpenAPI specification

## 4. Implementation Order

**Week 1: Core Foundation**
1. Domain model implementation (Phase 1)
2. Database migrations (Phase 2)
3. Infrastructure layer (Phase 2)

**Week 2: API Development**
4. Application layer (Phase 3)
5. REST adapter (Phase 4)
6. Basic endpoint testing

**Week 3: Advanced Features & Testing**
7. Version management
8. Conditional logic support
9. Comprehensive testing (Phase 5)
10. Documentation (Phase 6)

## 5. Backward Compatibility Strategy

To ensure no disruption to existing functionality:

1. **Keep `Exam.formTemplate` field**: Mark as @Deprecated but don't remove
2. **Dual write**: When creating/updating form templates via new API, also update `Exam.formTemplate` JSON
3. **Dual read**: If `Exam.formTemplateId` is null, fall back to `Exam.formTemplate`
4. **Migration script**: Provide optional script to convert existing JSON forms to structured FormTemplate

## 6. Risks & Mitigations

**Risk 1: Complex conditional logic implementation**
- Mitigation: Start with simple show/hide rules, defer complex cross-field validation to Phase 2

**Risk 2: Performance with large forms**
- Mitigation: Implement pagination for field list, lazy loading

**Risk 3: Breaking changes for frontend**
- Mitigation: Maintain backward compatibility, provide adapter layer for JSON schema

## 7. Success Metrics

- ✅ All PRD §5.4 requirements implemented
- ✅ API coverage increases from 20% to 100%
- ✅ Zero breaking changes for existing exams
- ✅ Test coverage ≥ 80%
- ✅ API response time < 200ms for field CRUD operations
- ✅ Support for all field types listed in PRD

## 8. Future Enhancements (Post-MVP)

- Field templates library (reusable field definitions)
- Form preview mode with sample data
- Import/export form templates (JSON/YAML)
- Form analytics (which fields cause most validation errors)
- AI-powered form optimization suggestions
- Multi-language field labels
