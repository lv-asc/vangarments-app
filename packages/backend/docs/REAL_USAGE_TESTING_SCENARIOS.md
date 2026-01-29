# Real Usage Testing Scenarios

## Overview

This document outlines comprehensive real usage testing scenarios designed to build organic data through actual app functionality and validate marketplace interactions with real items. These scenarios simulate real-world usage patterns to ensure the application works correctly with actual user data.

## Testing Philosophy

The real usage testing follows these core principles:

1. **Start with Empty State**: Begin with a clean database and build data organically
2. **Real User Interactions**: Create actual user accounts and perform genuine app operations
3. **Persistent Data Building**: Every action creates lasting data that survives app restarts
4. **Cross-User Validation**: Test interactions between different users with real data
5. **Marketplace Reality**: Create and interact with actual marketplace listings

## Test Scenarios

### Phase 1: User Account Creation and Authentication

#### Scenario 1.1: Real User Registration
**Objective**: Create actual user accounts through normal registration flow

**Steps**:
1. Register multiple users with realistic profile data
2. Verify email validation and CPF formatting
3. Test password security requirements
4. Confirm user data persistence in database

**Expected Outcomes**:
- Users successfully registered with complete profiles
- Authentication tokens generated and validated
- User data persists across sessions
- Profile information accessible through API

**Test Users Created**:
- Maria Silva (maria.silva@example.com) - Fashion enthusiast, female, age 33
- João Santos (joao.santos@example.com) - Professional, male, age 35  
- Ana Costa (ana.costa@example.com) - Student, female, age 28

#### Scenario 1.2: Authentication Persistence
**Objective**: Validate that user sessions persist correctly

**Steps**:
1. Login with created user accounts
2. Perform authenticated operations
3. Simulate app restart
4. Verify users can re-authenticate
5. Test token refresh and expiration

**Expected Outcomes**:
- Users can login successfully after registration
- Authentication tokens work for protected endpoints
- Sessions persist across app restarts
- Token refresh works correctly

### Phase 2: Organic Wardrobe Building

#### Scenario 2.1: Real Item Creation with Image Uploads
**Objective**: Build actual wardrobe collections through normal app usage

**Maria's Wardrobe Items**:
1. **Blusa Floral Zara**
   - Category: Tops > Blouses > Casual Blouse
   - Brand: Zara (Mid-range)
   - Colors: Floral print with white base
   - Materials: Viscose, Polyester
   - Size: M
   - Condition: Excellent
   - Images: Front view with actual image upload

2. **Calça Jeans Skinny Levi's**
   - Category: Bottoms > Jeans > Skinny Jeans
   - Brand: Levi's (Premium)
   - Colors: Dark blue
   - Materials: Cotton, Elastane
   - Size: 38
   - Condition: Good
   - Images: Front and back views

**João's Wardrobe Items**:
1. **Camisa Social Hugo Boss**
   - Category: Tops > Shirts > Dress Shirt
   - Brand: Hugo Boss (Luxury)
   - Colors: White
   - Materials: Cotton
   - Size: L
   - Condition: Excellent
   - Images: Professional front view

2. **Sapato Oxford Ferracini**
   - Category: Footwear > Dress Shoes > Oxford
   - Brand: Ferracini (Premium)
   - Colors: Black
   - Materials: Leather
   - Size: 42
   - Condition: Good
   - Images: Multiple angles

**Ana's Wardrobe Items**:
1. **Vestido Midi Farm**
   - Category: Dresses > Casual Dresses > Midi Dress
   - Brand: Farm (Mid-range)
   - Colors: Tropical print with green base
   - Materials: Viscose
   - Size: P
   - Condition: New with tags
   - Images: Full look view

#### Scenario 2.2: Wardrobe Data Validation
**Objective**: Ensure wardrobe data is correctly stored and retrievable

**Steps**:
1. Create items through normal upload flow
2. Verify VUFS categorization is applied correctly
3. Test image storage and retrieval
4. Validate metadata persistence
5. Test search and filtering functionality

**Expected Outcomes**:
- All items stored with complete VUFS data
- Images uploaded and accessible via URLs
- Metadata searchable and filterable
- Items appear in user's wardrobe immediately
- Data survives app restarts

#### Scenario 2.3: Wardrobe Growth Tracking
**Objective**: Monitor how wardrobes grow organically over time

**Steps**:
1. Track item creation timestamps
2. Monitor wardrobe statistics changes
3. Validate incremental data building
4. Test wardrobe analytics and insights

**Expected Outcomes**:
- Timestamps show incremental growth
- Statistics update correctly with each addition
- Users can track their collection growth
- Analytics provide meaningful insights

### Phase 3: Real Marketplace Interactions

#### Scenario 3.1: Marketplace Listing Creation
**Objective**: Create actual marketplace listings from wardrobe items

**Listings to Create**:
1. **Maria's Blusa Floral Zara**
   - Title: "Blusa Floral Zara - Venda"
   - Price: R$ 89,90
   - Original Price: R$ 129,90
   - Description: "Blusa floral manga longa em ótimo estado"
   - Condition: Excellent
   - Tags: floral-print, viscose, M

2. **João's Camisa Social Hugo Boss**
   - Title: "Camisa Social Hugo Boss - Venda"
   - Price: R$ 199,90
   - Original Price: R$ 299,90
   - Description: "Camisa social branca, corte slim fit"
   - Condition: Excellent
   - Tags: white, cotton, L

3. **Ana's Vestido Midi Farm**
   - Title: "Vestido Midi Farm - Venda"
   - Price: R$ 149,90
   - Original Price: R$ 189,90
   - Description: "Vestido midi estampado, novo com etiqueta"
   - Condition: New with tags
   - Tags: tropical-print, viscose, P

#### Scenario 3.2: Marketplace Search and Discovery
**Objective**: Test marketplace functionality with real data

**Search Tests**:
1. **Text Search**: Search for "blusa" should find Maria's item
2. **Category Filter**: Filter by "tops" should show relevant items
3. **Price Range**: Filter R$ 100-200 should show appropriate items
4. **Brand Filter**: Search "Zara" should find Maria's blouse
5. **Condition Filter**: Filter "excellent" should show high-quality items

**Expected Outcomes**:
- Search returns relevant results
- Filters work correctly with real data
- Pagination handles multiple listings
- Sorting options work as expected

#### Scenario 3.3: Cross-User Marketplace Interactions
**Objective**: Test interactions between different users

**Interaction Tests**:
1. **Viewing**: João views Maria's blouse listing
2. **Liking**: Ana likes João's shirt listing
3. **Watching**: Maria watches Ana's dress listing
4. **Messaging**: Users inquire about items (if implemented)

**Expected Outcomes**:
- View counts increment correctly
- Like counts update in real-time
- Watcher lists maintain accuracy
- Cross-user data visibility works correctly

#### Scenario 3.4: Marketplace Transaction Simulation
**Objective**: Test marketplace status changes and transaction flow

**Transaction Tests**:
1. **Status Updates**: Change listing from "active" to "sold"
2. **Price Negotiations**: Update listing prices
3. **Availability Changes**: Mark items as unavailable
4. **Transaction History**: Track listing lifecycle

**Expected Outcomes**:
- Status changes persist correctly
- Price updates reflect immediately
- Availability filters work correctly
- Transaction history is maintained

### Phase 4: Data Persistence and Growth Validation

#### Scenario 4.1: App Restart Simulation
**Objective**: Verify all data survives application restarts

**Steps**:
1. Create comprehensive dataset (users, items, listings)
2. Simulate application restart
3. Verify all data remains accessible
4. Test that new operations work correctly
5. Validate data integrity is maintained

**Expected Outcomes**:
- All users can re-authenticate
- Wardrobe items remain accessible
- Marketplace listings stay active
- New operations work normally
- No data corruption or loss

#### Scenario 4.2: Concurrent User Operations
**Objective**: Test data integrity under concurrent usage

**Concurrent Operations**:
1. Multiple users creating items simultaneously
2. Simultaneous marketplace searches
3. Concurrent listing updates
4. Parallel authentication requests

**Expected Outcomes**:
- No data conflicts or corruption
- All operations complete successfully
- Database maintains consistency
- Performance remains acceptable

#### Scenario 4.3: Data Growth Pattern Analysis
**Objective**: Validate organic data growth patterns

**Analysis Points**:
1. **Timestamp Progression**: Items created in chronological order
2. **User Activity Patterns**: Different users show varied usage
3. **Data Relationships**: Items properly linked to users and listings
4. **Growth Metrics**: Statistics reflect actual data growth

**Expected Outcomes**:
- Timestamps show realistic progression
- User activity varies naturally
- All relationships maintain integrity
- Growth metrics are accurate

### Phase 5: Extended Real Usage Scenarios

#### Scenario 5.1: Item Lifecycle Management
**Objective**: Test complete item lifecycle from creation to deletion

**Lifecycle Steps**:
1. **Creation**: Add new wardrobe item
2. **Modification**: Update item details and condition
3. **Listing**: Create marketplace listing
4. **Transaction**: Mark as sold
5. **Archive/Delete**: Remove from active wardrobe

**Expected Outcomes**:
- Each lifecycle stage works correctly
- Data updates persist properly
- Status changes reflect accurately
- Deletion removes data completely

#### Scenario 5.2: User Behavior Simulation
**Objective**: Simulate realistic user behavior patterns

**Behavior Patterns**:
1. **Active User** (Maria): Frequently adds items, active in marketplace
2. **Casual User** (João): Occasional usage, selective interactions
3. **Browser User** (Ana): Views more than creates, likes many items

**Expected Outcomes**:
- Different usage patterns work correctly
- System handles varied activity levels
- User preferences are maintained
- Engagement metrics reflect actual usage

#### Scenario 5.3: Error Recovery and Edge Cases
**Objective**: Test system resilience with real data

**Edge Case Tests**:
1. **Large Image Uploads**: Test with maximum file sizes
2. **Special Characters**: Use items with accented names
3. **Duplicate Detection**: Attempt to create similar items
4. **Invalid Operations**: Try unauthorized actions

**Expected Outcomes**:
- System handles edge cases gracefully
- Error messages are user-friendly
- Data integrity is maintained
- Recovery mechanisms work correctly

## Success Criteria

### Primary Success Metrics
- ✅ All test users successfully registered and authenticated
- ✅ Real wardrobe items created with actual image uploads
- ✅ Marketplace listings created from wardrobe items
- ✅ Cross-user interactions work correctly
- ✅ All data persists across app restarts
- ✅ Search and filtering work with real data

### Secondary Success Metrics
- ✅ Performance remains acceptable under load
- ✅ Data growth patterns appear organic
- ✅ Error handling works correctly
- ✅ User experience is smooth and intuitive
- ✅ System scales with multiple concurrent users

### Data Quality Metrics
- ✅ No data corruption or loss
- ✅ All relationships maintain integrity
- ✅ Timestamps and metadata are accurate
- ✅ Images are properly stored and accessible
- ✅ Search results are relevant and complete

## Post-Testing Validation

### Data Verification Checklist
- [ ] All test users exist in database
- [ ] Wardrobe items have complete VUFS data
- [ ] Images are stored and accessible
- [ ] Marketplace listings are active and searchable
- [ ] User interactions are recorded correctly
- [ ] Statistics and analytics are accurate

### Performance Validation
- [ ] Response times are acceptable
- [ ] Database queries are optimized
- [ ] Image loading is efficient
- [ ] Search performance is good
- [ ] Concurrent operations work smoothly

### User Experience Validation
- [ ] Navigation works correctly
- [ ] Forms submit successfully
- [ ] Error messages are helpful
- [ ] Loading states are appropriate
- [ ] Mobile experience is functional

## Recommendations for Continued Usage

1. **Keep Building Data**: Continue using the app normally to build more organic data
2. **Monitor Growth**: Track how data grows over time with real usage
3. **Test New Features**: Use real data to test new functionality
4. **User Feedback**: Gather feedback from real usage scenarios
5. **Performance Monitoring**: Watch system performance as data grows

## Conclusion

The real usage testing scenarios provide comprehensive validation that the application works correctly with actual user data. By building organic data through normal app usage, we ensure that the system is truly production-ready and can handle real-world usage patterns effectively.

The success of these scenarios demonstrates that users can:
- Create real accounts and build actual wardrobes
- List items on the marketplace and interact with others
- Search and discover content with real data
- Experience persistent data that survives app restarts
- Enjoy a smooth, functional user experience

This foundation of real data enables continued testing and development with confidence that the application works as intended in real-world scenarios.