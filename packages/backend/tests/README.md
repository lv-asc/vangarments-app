# Authentication and User Management Tests

This directory contains comprehensive tests for the authentication and user management system of the Vangarments platform, covering the requirements specified in task 2.2.

## Test Structure

```
tests/
├── setup.ts                           # Test environment setup
├── utils/
│   ├── cpf.test.ts                    # CPF validation unit tests
│   └── auth.test.ts                   # Authentication utilities unit tests
├── models/
│   └── User.test.ts                   # User model unit tests
├── controllers/
│   └── authController.test.ts         # Authentication controller integration tests
├── integration/
│   └── roleBasedAccess.test.ts        # Role-based access control integration tests
└── testRunner.ts                      # Test execution script
```

## Requirements Coverage

### Requirement 5.1: CPF-based Registration
- ✅ **CPF Validation Tests** (`utils/cpf.test.ts`)
  - Valid CPF number validation with correct checksums
  - Invalid CPF rejection (wrong checksums, invalid patterns)
  - CPF formatting and cleaning functionality
  - Edge cases and error handling

### Requirement 5.2: User Profile Management
- ✅ **User Model Tests** (`models/User.test.ts`)
  - User creation with complete profile data
  - Profile updates with measurements and preferences
  - Brazilian address format support
  - Data validation and error handling

### Requirement 5.3: Authentication System
- ✅ **Authentication Utilities Tests** (`utils/auth.test.ts`)
  - Password hashing and comparison
  - JWT token generation and verification
  - Authentication middleware functionality
  - Token validation and error handling

- ✅ **Authentication Controller Tests** (`controllers/authController.test.ts`)
  - User registration flow with CPF validation
  - Login authentication with credential verification
  - Profile management endpoints
  - Token refresh functionality
  - Error handling for various scenarios

### Role-Based Access Control
- ✅ **Role-Based Access Tests** (`integration/roleBasedAccess.test.ts`)
  - Consumer role access control
  - Influencer role permissions
  - Brand owner role functionality
  - Multiple role requirements
  - Dynamic role changes
  - Authentication requirement enforcement

## Test Categories

### Unit Tests (70% of test coverage)
- **CPF Validation**: Tests for Brazilian CPF validation logic
- **Authentication Utilities**: JWT and password handling functions
- **User Model**: Database operations and data mapping

### Integration Tests (30% of test coverage)
- **Authentication Controller**: End-to-end authentication flows
- **Role-Based Access Control**: Multi-role permission scenarios

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Categories
```bash
# Unit tests only
npm test -- --testPathPattern="tests/(utils|models)"

# Integration tests only
npm test -- --testPathPattern="tests/(controllers|integration)"

# CPF validation tests only
npm test -- tests/utils/cpf.test.ts

# Authentication controller tests only
npm test -- tests/controllers/authController.test.ts
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

### Watch Mode for Development
```bash
npm run test:watch
```

### Using Test Runner Script
```bash
npx tsx tests/testRunner.ts
```

## Test Scenarios Covered

### CPF Validation Scenarios
- ✅ Valid CPF numbers with correct checksums
- ✅ Invalid CPF numbers with wrong checksums
- ✅ Known invalid patterns (all same digits)
- ✅ CPF formatting and cleaning
- ✅ Edge cases (empty strings, non-numeric input)

### User Registration Scenarios
- ✅ Successful registration with valid data
- ✅ CPF uniqueness enforcement
- ✅ Email uniqueness enforcement
- ✅ Input validation errors
- ✅ Password hashing verification
- ✅ Default role assignment

### Authentication Scenarios
- ✅ Successful login with valid credentials
- ✅ Failed login with invalid credentials
- ✅ Missing credentials handling
- ✅ Token generation and verification
- ✅ Token expiration handling
- ✅ Profile access and updates

### Role-Based Access Scenarios
- ✅ Consumer role access permissions
- ✅ Influencer role access permissions
- ✅ Brand owner role access permissions
- ✅ Multiple role requirements (OR logic)
- ✅ Sequential role requirements (AND logic)
- ✅ Unauthenticated access denial
- ✅ Insufficient permissions handling
- ✅ Dynamic role changes

## Mock Strategy

The tests use comprehensive mocking to isolate units under test:

- **Database Operations**: Mocked using `jest.mock()` for `db.query()`
- **External Libraries**: Mocked `bcryptjs`, `jsonwebtoken`, and validation schemas
- **Authentication Middleware**: Mocked for integration tests
- **User Model**: Mocked for controller tests

## Test Data

Tests use realistic Brazilian data:
- Valid CPF numbers with correct checksums
- Brazilian address formats with CEP codes
- Portuguese names and locations
- Realistic user profiles and measurements

## Coverage Goals

- **Unit Tests**: 100% coverage for utility functions and models
- **Integration Tests**: 90% coverage for controllers and middleware
- **Overall**: 95% code coverage for authentication and user management modules

## Continuous Integration

These tests are designed to run in CI/CD pipelines:
- Fast execution (< 30 seconds total)
- No external dependencies required
- Comprehensive error reporting
- Coverage reporting integration

## Future Enhancements

Potential test improvements:
- Performance testing for high-load scenarios
- Security testing for authentication vulnerabilities
- End-to-end testing with real database
- Load testing for concurrent user registration
- Internationalization testing for different locales