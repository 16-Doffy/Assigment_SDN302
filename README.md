PE_SDN302_TrialTest_StudentCode

Requirements implemented
- Express app using EJS views, MongoDB (Mongoose), JWT auth
- Database name via .env (PE_SDN302_TrialTest_StudentCodeDB)
- Seed from data/courses.json, data/sections.json, data/members.json
- REST API for Courses with JWT at /api/courses
- Auth API: POST /auth/login returns JWT
- Views for Sections at /view/sections with login at /auth/signin

Setup
1) Copy .env.example to .env and edit values:
   - JWT_SECRET must be your StudentCode@
   - MONGODB_URI must point to PE_SDN302_TrialTest_StudentCodeDB
2) Install packages:
   npm install
3) Seed database:
   npm run seed
4) Run app:
   npm run dev

API
- POST /auth/login { username, password } -> { token }
- Use Authorization: Bearer <token> for /api/courses endpoints

Views
- GET /auth/signin (login form for Members)
- After login redirect to /view/sections (CRUD with validations)

Validations
- Courses: name/description required
- Sections: sectionName words capitalized (A-Z), alnum and spaces; duration >= 0; course required; isMainTask is toggle


