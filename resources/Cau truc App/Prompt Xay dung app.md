**Web Tất Tần Tật đã xây dựng xong trước** , prompt cho App nên yêu cầu AI **tái sử dụng toàn bộ Backend/API, PostgreSQL, Form Engine và Design System của Web** , tuyệt đối không tạo một hệ thống dữ liệu riêng. 

TRIỂN KHAI APP ANDROID “TẤT TẦN TẬT” 

SAU KHI WEB ĐÃ HOÀN THIỆN 

================================================== 

1. BỐI CẢNH DỰ ÁN 

================================================== 

Tôi đã hoàn thiện phiên bản Web Marketplace của nền tảng: 

TÊN: 

Tất Tần Tật 

SLOGAN: 

“Mua bán mọi thứ, gần bạn” 

Tất Tần Tật là marketplace cho phép người dùng: 

- Mua sản phẩm 

- Bán sản phẩm 

- Đăng tin 

- Tìm kiếm 

- Nhắn tin 

- Yêu thích 

- Báo cáo tin đăng 

- Quản lý tin đăng 

- Quản lý tài khoản 

- Giao dịch 

- Quảng cáo 

Web đã có: 

- Frontend 

- Backend/API 

- PostgreSQL 

- Authentication 

- Category system 

- Dynamic Listing Form Engine 

- Listing management 

- User management 

- Advertisement system 

- Image storage 

- Notification system 

Nhiệm vụ bây giờ: 

XÂY DỰNG ỨNG DỤNG ANDROID TẤT TẦN TẬT VÀ KẾT NỐI TRỰC TIẾP VỚI HỆ THỐNG WEB HIỆN CÓ. 

================================================== 

2. NGUYÊN TẮC QUAN TRỌNG NHẤT 

================================================== 

KHÔNG xây Backend mới. 

KHÔNG tạo PostgreSQL riêng. 

KHÔNG tạo hệ thống tài khoản riêng. 

KHÔNG tạo Category Database riêng. 

KHÔNG tạo Listing Database riêng. 

KHÔNG hard-code dữ liệu sản phẩm trong App. 

Android App phải sử dụng: 

WEB BACKEND + API HIỆN CÓ + POSTGRESQL HIỆN CÓ + OBJECT STORAGE HIỆN CÓ + AUTHENTICATION HIỆN CÓ 

App chỉ là một client mới của hệ thống. 

Kiến trúc: 

Android App ↓ Existing API ↓ Existing Backend ↓ PostgreSQL 

Ảnh / Video: Android ↓ Existing Upload API ↓ Object Storage ↓ 

CDN 

================================================== 

# 3. CÔNG NGHỆ ANDROID 

================================================== 

Sử dụng: 

Kotlin 

Jetpack Compose Material 3 Android Architecture Components 

Coroutines 

Flow ViewModel Navigation Compose Repository Pattern Dependency Injection 

Ưu tiên: 

- Clean Architecture 

- MVVM 

- Modular Architecture 

- Single Source of Truth 

- Offline-friendly UI 

- Secure Token Storage 

Không sử dụng XML Layout nếu không cần thiết. 

================================================== 

4. CẤU TRÚC PROJECT 

================================================== 

Tạo project: 

TatTanTatAndroid 

Cấu trúc đề xuất: 

app/ 

core/ network/ database/ authentication/ storage/ notifications/ analytics/ ui/ common/ 

feature/ splash/ onboarding/ auth/ home/ category/ search/ listing/ listing_create/ listing_edit/ favorite/ chat/ 

notification/ 

order/ profile/ settings/ report/ 

navigation/ 

di/ 

================================================== 

5. DESIGN SYSTEM 

================================================== 

Tái sử dụng Design System của Web Tất Tần Tật. 

Không tự ý thay đổi nhận diện thương hiệu. 

Màu chủ đạo: 

Primary: 

#008F5A 

Background: 

#F7FAF8 

Text: 

#163B31 

Success: #008F5A 

Warning: 

#F59E0B 

Error: 

#DC2626 

Thiết kế: 

- Clean 

- Modern 

- Friendly 

- Marketplace 

- Material 3 

- Card UI 

- Border radius 10–14dp 

- Khoảng trắng hợp lý 

- Typography dễ đọc 

- Touch target tối thiểu 48dp 

Logo: 

Sử dụng logo Tất Tần Tật chính thức của dự án. 

================================================== 

6. MÀN HÌNH ANDROID 

================================================== 

Triển khai các màn hình: 

01 Splash 

02 Onboarding 

03 Đăng nhập 

04 Đăng ký 

05 OTP 

06 Quên mật khẩu 

07 Trang chủ 

08 Danh mục 

09 Danh mục con 

10 Tìm kiếm 

11 Bộ lọc 

12 Danh sách sản phẩm 

13 Chi tiết sản phẩm 

14 Gallery hình ảnh 

15 Hồ sơ người bán 

16 Yêu thích 

17 Đăng tin 

- 18 Chọn danh mục đăng tin 

19 Form Dynamic Listing 

20 Upload hình ảnh 

21 Upload video 

22 Chọn vị trí 

23 Preview tin đăng 

24 Xác nhận đăng tin 

25 Đăng tin thành công 

26 Tin của tôi 

27 Tin đang chờ duyệt 

28 Tin đã đăng 

29 Tin đã bán 

30 Tin bị từ chối 

31 Chỉnh sửa tin 

32 Chat 

33 Danh sách cuộc trò chuyện 

34 Thông báo 

35 Đơn hàng 

36 Chi tiết đơn hàng 37 Hồ sơ cá nhân 38 Chỉnh sửa hồ sơ 39 Cài đặt 40 Trung tâm trợ giúp 41 Báo cáo tin đăng 42 Báo cáo người dùng ================================================== 7. BOTTOM NAVIGATION ================================================== Sử dụng: Trang chủ Danh mục Đăng tin Tin nhắn Tài khoản Nút: “Đăng tin” 

phải nổi bật hơn các mục còn lại. 

================================================== 

8. HOME 

================================================== 

Trang chủ App phải đồng bộ với Web. 

Bao gồm: 

- Logo 

- Search bar 

- Vị trí hiện tại 

- Banner 

- Danh mục 

- Sản phẩm nổi bật 

- Tin mới 

- Tin gần bạn 

- Bất động sản 

- Xe cộ 

- Đồ công nghệ 

- Dịch vụ 

- Quảng cáo 

Không hard-code nội dung. 

Tất cả lấy từ API. 

================================================== 

9. SEARCH 

================================================== 

Tạo hệ thống tìm kiếm: 

- Keyword 

- Category 

- Subcategory 

- Price min 

- Price max 

- Location 

- Distance 

- Condition 

- Seller type 

- Sort 

Sort: 

- Liên quan 

- Mới nhất 

- Giá thấp → cao 

- Giá cao → thấp 

- Gần tôi 

Hỗ trợ: 

debounce 

pagination 

infinite scrolling 

================================================== 

10. LISTING DETAIL 

================================================== 

Trang chi tiết phải hiển thị: 

- Gallery 

- Video 

- Tiêu đề 

- Giá 

- Trạng thái 

- Thông tin sản phẩm 

- Dynamic attributes 

- Mô tả 

- Vị trí 

- Người bán 

- Avatar 

- Đánh giá 

- Số tin đã đăng 

- Thời gian tham gia 

- Nút gọi 

- Nút nhắn tin 

- Yêu thích 

- Chia sẻ 

- Báo cáo 

================================================== 

11. DYNAMIC LISTING FORM 

================================================== 

ĐÂY LÀ PHẦN QUAN TRỌNG NHẤT. 

Không tạo form riêng hard-code cho: 

Điện thoại Laptop Ô tô 

Xe máy Nhà Đất ... Thay vào đó: Android gọi: GET /categories 

GET /listing-templates/{categoryId} 

GET /listing-fields/{templateId} 

Backend trả về field configuration. 

App tự render UI. 

Ví dụ: category: Điện thoại fields: 

brand model ram storage color condition 

# warranty 

App tự tạo: TextField Dropdown Radio Checkbox Number Currency Date ... 

================================================== 

12. CÁC NHÓM FORM ================================================== 

Phải hỗ trợ tối thiểu: 

1. Đồ công nghệ 2. Xe cộ 3. Nhà đất 4. Đồ gia dụng 

5. Thời trang 

6. Thể thao & giải trí 7. Sách 

8. Máy móc & công cụ 

9. Đồ sưu tầm 10. Thú cưng 11. Hàng hóa khác 12. Dịch vụ 

Nếu Admin Web thêm category hoặc field mới: 

Android phải tự nhận được field mới mà KHÔNG cần phát hành phiên bản App mới. 

================================================== 

13. ĐĂNG TIN 

================================================== 

Flow: 

Chọn danh mục ↓ Thông tin sản phẩm ↓ Dynamic Fields ↓ Mô tả ↓ Ảnh / Video ↓ Giá ↓ Vị trí ↓ Thông tin liên hệ ↓ Preview ↓ Xác nhận ↓ Publish 

Hỗ trợ: 

- Save Draft 

- Auto Save 

- Resume Draft 

- Validation 

- Upload Progress 

- Retry Upload 

================================================== 

14. IMAGE UPLOAD 

================================================== 

Cho phép: 

- Tối đa 20 ảnh 

- Video 

- Chọn ảnh đại diện 

- Reorder 

- Delete 

- Preview 

- Compression 

- Progress 

- Retry 

Không upload trực tiếp vào PostgreSQL. 

Upload thông qua API/Object Storage hiện có. 

================================================== 

15. AUTHENTICATION 

================================================== 

Sử dụng Authentication hiện có của Web. 

Hỗ trợ: 

- Email 

- Phone 

- OTP 

- Google 

- Apple nếu Backend đã hỗ trợ 

Token: 

Access Token 

Refresh Token 

Lưu token an toàn. 

Không lưu password plain text. 

Tự động refresh token. 

Nếu token hết hạn: 

→ refresh 

Nếu refresh thất bại: 

→ đưa về Login. 

================================================== 

16. CHAT 

================================================== 

Chat phải dùng Backend hiện có. 

Hỗ trợ: 

- Text 

- Image 

- Read status 

- Typing indicator 

- Online status 

- Timestamp 

- Block user 

- Report user 

Sử dụng WebSocket nếu Backend đã hỗ trợ. 

Không tạo hệ thống chat riêng. 

================================================== 

17. NOTIFICATION 

================================================== 

Tích hợp Firebase Cloud Messaging nếu hệ thống hiện tại sử dụng FCM. 

Notification cho: 

- Tin đăng được duyệt 

- Tin bị từ chối 

- Có người nhắn tin 

- Có người quan tâm 

- Đơn hàng 

- Thanh toán 

- Khuyến mãi 

- Quảng cáo 

- Hệ thống 

Click notification phải mở đúng màn hình. 

================================================== 

18. FAVORITE 

================================================== 

Người dùng có thể: 

- Thêm yêu thích 

- Xóa yêu thích 

- Xem danh sách yêu thích 

Dữ liệu lấy từ API. 

Không lưu favorite chỉ ở local. 

================================================== 

19. LOCATION 

================================================== 

Tích hợp: 

- GPS 

- Permission 

- Province 

- District 

- Ward 

- Distance 

Cho phép: 

“Tin gần tôi” 

Ví dụ: 

Trong bán kính: 

1 km 5 km 10 km 20 km 

50 km 

================================================== 

20. OFFLINE / CACHE 

================================================== 

App phải có cache cho: 

- Category 

- User profile 

- Recent searches 

- Favorite tạm thời 

- Home data 

Khi mất mạng: 

Hiển thị: 

“Bạn đang offline.” 

Không làm mất dữ liệu form đang nhập. 

Draft phải được lưu local. 

================================================== 21. API INTEGRATION ================================================== Trước khi viết UI gọi API: Đọc toàn bộ API hiện tại của Web. 

Nếu có Swagger/OpenAPI: 

IMPORT API SPEC. Không tự đoán endpoint. 

Kiểm tra: 

- Authentication - Request - Response - Error code - Pagination - Upload - WebSocket 

Nếu API chưa đủ: 

LIỆT KÊ API CÒN THIẾU 

và tạo danh sách yêu cầu Backend bổ sung. 

Không tự tạo API khác nếu API hiện tại đã có. 

================================================== 22. ERROR HANDLING ================================================== 

Tất cả API phải xử lý: 

400 401 403 404 409 422 429 500 Network Error Timeout Thông báo bằng tiếng Việt. 

Ví dụ: 

“Mạng không ổn định. Vui lòng thử lại.” 

“Phiên đăng nhập đã hết hạn.” 

“Tin đăng không còn tồn tại.” 

================================================== 

23. PERFORMANCE 

================================================== 

Tối ưu: 

- LazyColumn 

- LazyGrid 

- Image caching 

- Pagination 

- Debounced search 

- Request cancellation 

- Memory management 

- Compose recomposition 

- Network caching 

Không load toàn bộ listing cùng lúc. 

================================================== 

24. SECURITY 

================================================== 

Không hard-code: 

API Secret Database password JWT secret Firebase private key 

Sử dụng: 

BuildConfig 

Environment variables 

Secure storage 

Certificate pinning nếu cần thiết. 

================================================== 

25. ANALYTICS 

================================================== 

Chuẩn bị tracking: 

- App open 

- Search 

- Product view 

- Listing view 

- Favorite 

- Contact seller 

- Start listing 

- Publish listing 

- Chat 

- Purchase 

- Advertisement click 

Không thu thập dữ liệu cá nhân ngoài phạm vi cần thiết. 

================================================== 

26. DEEP LINK 

================================================== 

Hỗ trợ link: 

https://tattantat.vn/listing/{id} 

Khi người dùng bấm link: Nếu có App: → mở App → mở Listing Detail Nếu chưa có App: → mở Web Listing Detail. 

================================================== 27. VERSIONING 

================================================== 

App version: 

1.0.0 API: /api/v1 Không phá vỡ API cũ khi nâng cấp. 

Nếu cần breaking change: 

Tạo: 

/api/v2 

================================================== 

# 28. TEST 

================================================== 

Viết: Unit Test Repository Test ViewModel Test UI Test Navigation Test API Integration Test Test các flow quan trọng: 

Register Login Search View Listing Favorite Chat Create Listing Upload Image Publish Listing Edit Listing Delete Listing 

================================================== 

29. QUAN TRỌNG: TEST ĐỒNG BỘ WEB ↔ APP 

================================================== 

Test: 

CASE 1 

Đăng tin trên Android. 

Kiểm tra Web. Tin phải xuất hiện. CASE 2 Đăng tin trên Web. Kiểm tra Android. 

Tin phải xuất hiện. 

CASE 3 Edit Listing trên Web. 

Android phải nhận dữ liệu mới. 

CASE 4 

Edit Listing trên Android. 

Web phải nhận dữ liệu mới. 

CASE 5 

Favorite trên Android. 

Web phải phản ánh trạng thái. 

CASE 6 

Chat Web. 

Android nhận message realtime. CASE 7 Chat Android. Web nhận message realtime. CASE 8 Admin duyệt tin. Android phải cập nhật trạng thái. 

================================================== 30. ADMIN ↔ APP ================================================== 

Admin Web có quyền: Approve Reject Hide Delete Feature Ban 

Android phải phản ánh trạng thái Listing. 

Ví dụ: Admin: REJECTED Android: “Tin đăng chưa được duyệt.” Không cho hiển thị listing bị ẩn. ================================================== 31. BUILD ================================================== Tạo: Development Staging Production Build: debug staging release Không sử dụng Production API trong Debug. 

================================================== 

32. OUTPUT 

================================================== 

Khi hoàn thành phải cung cấp: 

1. Android source code 

2. Gradle project 

3. README 

4. Environment configuration 

5. API configuration 

6. Build instructions 

7. Debug APK 

8. Release AAB 

9. Unit tests 

10. UI tests 

11. API integration documentation 

README phải hướng dẫn: 

- Cài Android Studio 

- Cấu hình JDK 

- Clone project 

- Configure API URL 

- Build Debug 

- Build Release 

- Generate APK 

- Generate AAB 

================================================== 

33. QUY TẮC PHÁT TRIỂN 

================================================== 

Trước khi code: 

1. Kiểm tra cấu trúc Web hiện tại. 

2. Kiểm tra API. 

3. Kiểm tra PostgreSQL schema. 

4. Kiểm tra Authentication. 

5. Kiểm tra Form Engine. 

6. Kiểm tra Object Storage. 

7. Kiểm tra Notification. 

8. Kiểm tra WebSocket. 

Sau đó lập: 

IMPLEMENTATION PLAN 

chia thành: 

Phase 1: 

Project + Architecture 

Phase 2: 

Authentication 

Phase 3: Home + Category 

Phase 4: 

Search + Listing 

Phase 5: 

Listing Detail 

Phase 6: Dynamic Listing Form Phase 7: Image/Video Phase 8: Favorite Phase 9: Chat Phase 10: Notification Phase 11: Profile Phase 12: Testing Phase 13: Release 

================================================== 34. TIÊU CHÍ HOÀN THÀNH ================================================== 

App được coi là hoàn thành khi: 

[✓] Đăng nhập được tài khoản Web [✓] Hiển thị dữ liệu thật từ API [✓] Search dữ liệu thật [✓] Xem Listing thật [✓] Favorite đồng bộ [✓] Chat đồng bộ [✓] Đăng tin thật [✓] Dynamic Form hoạt động [✓] Upload ảnh [✓] Upload video [✓] GPS hoạt động [✓] Notification hoạt động [✓] Admin duyệt tin [✓] Web ↔ Android đồng bộ [✓] Không có database riêng cho App 

- [✓] Không hard-code dữ liệu marketplace 

- [✓] Build Release thành công 

================================================== 

MỤC TIÊU CUỐI CÙNG 

================================================== 

Xây dựng Android App Tất Tần Tật như một client chính thức của Marketplace hiện tại. 

Web, Android và Admin phải sử dụng: 

MỘT BACKEND MỘT API MỘT DATABASE MỘT USER SYSTEM 

MỘT LISTING SYSTEM MỘT FORM ENGINE MỘT MEDIA STORAGE 

Kiến trúc phải đủ tốt để sau này có thể bổ sung: 

iOS App 

Seller Center 

Business Account 

Payment 

Advertising Platform 

Recommendation Engine 

AI Search 

AI Moderation 

mà không phải xây lại hệ thống. 

# **Thứ tự tôi khuyên bạn chạy prompt này** 

Đừng đưa AI một lần rồi yêu cầu **“code toàn bộ App”** . Với dự án lớn như Tất Tần Tật, nên chia thành: 

**Phase 1 → Audit Web/API hiện tại Phase 2 → Android architecture Phase 3 → Authentication Phase 4 → Home + Category + Search Phase 5 → Product Detail Phase 6 → Dynamic Listing Engine Phase 7 → Chat + Notification Phase 8 → Testing Web ↔ Android Phase 9 → Build APK/AAB + Google Play** 

Đặc biệt, **Phase 1 phải làm trước** : yêu cầu AI đọc source Web hiện tại, Swagger/OpenAPI, database schema và Form Engine rồi mới code Android. Điều này tránh tình trạng AI tự tạo API hoặc database thứ hai, khiến Web và App sau này bị lệch dữ liệu. 

