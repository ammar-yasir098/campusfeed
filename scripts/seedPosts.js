const sequelize = require('../config/database');
const { User, Post } = require('../models');
const bcrypt = require('bcrypt');

const CATEGORIES = ['Announcements', 'Events', 'General', 'Lost & Found', 'Buy & Sell'];

const SEED_DATA = {
  Announcements: [
    { title: 'Spring 2026 Midterm Exam Date Sheet Released', content: 'The official midterm examination schedule for SST and HSM has been uploaded on the UMT portal. Please check your course dates.' },
    { title: 'Library Hours Extended for Midterm Prep', content: 'UMT Main Library will remain open until 11:00 PM starting this Monday to accommodate midterm study sessions.' },
    { title: 'UMT Hackathon 2026 Registration Now Open', content: 'Annual SST CodeFest is here! Register your team of 3-4 members before Friday. Exciting cash prizes for top 3 teams.' },
    { title: 'Campus Cafeteria Maintenance Notice', content: 'Central Food Court area B will undergo routine renovation over the weekend. Alternative food stalls remain open.' },
    { title: 'Scholarship Application Deadline Notice', content: 'Need-based and merit scholarship renewal forms must be submitted to the Financial Aid office by 5:00 PM tomorrow.' },
    { title: 'Semester Fee Installment Slip Available', content: 'Challan slips for 2nd installment are available on the student portal. Late fee fine applies after the 15th.' },
    { title: 'Course Registration Add/Drop Deadline', content: 'Students can add or drop courses without penalty until midnight tonight. Contact your academic advisor for assistance.' },
    { title: 'UMT Sports Complex Maintenance', content: 'Gymnasium and badminton courts will be reserved for inter-university trials tomorrow from 9:00 AM to 3:00 PM.' },
    { title: 'Guest Lecture: AI & Future of Software Engineering', content: 'Dr. Tariq from Tech Global will deliver a key keynote in Senate Hall on Thursday at 2:00 PM. All SST students invited.' },
    { title: 'Official UMT Bus Route Changes', content: 'Revised route timings for Johar Town and Model Town transport buses updated on transport bulletin board.' }
  ],
  Events: [
    { title: 'Annual UMT Technofest 2026', content: 'Join us for 3 days of robotics, gaming competitions, software exhibitions, and musical evening in UMT main grounds.' },
    { title: 'CS Society Gaming Tournament (FIFA & Tekken 8)', content: 'Show your skills in FIFA 24 and Tekken 8 tournament! Registration fee Rs. 300 per head. Trophy for winner!' },
    { title: 'Entrepreneurship Startup Pitch Competition', content: 'Present your business startup idea to angel investors at HSM Auditorium. Winner gets incubation grant!' },
    { title: 'UMT Debating Society Inter-Dept Championship', content: 'Parliamentary style debate on Global Tech Ethics. Support your department debaters this Friday.' },
    { title: 'Welcome Social Night for Batch F26', content: 'Fun evening featuring live acoustic music, drama performances, and food stalls for first year students.' },
    { title: 'Blood Donation Drive by Red Crescent Society', content: 'Save lives by donating blood at the UMT Medical Complex. Refreshments and certificate provided to donors.' },
    { title: 'Web Development Hands-on Bootcamp', content: 'Full-day workshop on React & Node.js hosted by SST Alumni. Bring your laptop to Lab 4.' },
    { title: 'UMT Annual Photography & Art Exhibition', content: 'Display your creative photography and paintings in the Student Center gallery. Cash prizes awarded.' },
    { title: 'Cybersecurity & Ethical Hacking Seminar', content: 'Learn penetration testing basics and network security tools with industry experts.' },
    { title: 'UMT Alumni Networking & Placement Meetup', content: 'Meet top alumni working in leading IT firms and multinationals. Bring your updated resume.' }
  ],
  General: [
    { title: 'Best quiet study spots on campus?', content: 'Hey everyone! Where is the quietest place to study between 2 PM and 5 PM when the main library gets crowded?' },
    { title: 'Looking for study partner for Data Structures', content: 'Anyone taking DS with Prof. Ahmad? Looking to form a study group for upcoming midterm prep.' },
    { title: 'How is the food quality at Main Canteen?', content: 'First-year student here! What are the best recommended dishes at the campus food courts?' },
    { title: 'Fast Wi-Fi spot near SST Block?', content: 'Which floor in SST Block has the strongest Wi-Fi signal for downloading lecture slides?' },
    { title: 'Recommendation for FYP project ideas in Machine Learning', content: 'Looking for innovative Final Year Project ideas combining Computer Vision and Web Dev.' },
    { title: 'Any active campus photography club?', content: 'Are there any official student clubs for photography and videography looking for new members?' },
    { title: 'Tips for preparing OS (Operating Systems) exam', content: 'Seniors please share study tips and important topics for OS midterm exam!' },
    { title: 'Parking space near Admin block full by 9 AM', content: 'Friendly reminder to arrive 15 minutes early if you park near Admin block parking lot.' },
    { title: 'Where to print lab reports quickly near campus?', content: 'Any affordable printing shops near main gate that print color project reports?' },
    { title: 'Great rainy weather on campus today!', content: 'Campus looks beautiful after the morning rain! Enjoying tea with friends near central lawn.' }
  ],
  'Lost & Found': [
    { title: 'Lost: Black Dell Laptop Charger in SST Lab 3', content: 'Left a 65W Dell laptop charger on desk 12 in SST Lab 3 around 3:30 PM. Please return if found!' },
    { title: 'Found: Student CNIC near Main Gate Cafe', content: 'Found a CNIC card belonging to Saad Khan near main cafe entrance. Handed over to security guard.' },
    { title: 'Lost: Black Leather Wallet with Student Card', content: 'Lost my wallet containing student ID (CS-2025-14) near library. Please contact me if found.' },
    { title: 'Found: Set of 3 Keys with Car Remote', content: 'Found keys with a Toyota remote on the bench near Central Lawn. Kept safely at Admin helpdesk.' },
    { title: 'Lost: Silver Apple Airpods Case', content: 'Lost an Airpods Pro charging case (no earbuds inside) in Auditorium Block B. Reward offered!' },
    { title: 'Found: Blue Parker Pen in Seminar Room 2', content: 'Found an engraved blue Parker pen after 11 AM class in Seminar Room 2.' },
    { title: 'Lost: Black Casio Calculator fx-991EX', content: 'Left my scientific calculator in Math lecture hall 104. Has my initials AK written on back.' },
    { title: 'Found: Red Water Bottle in Sports Complex', content: 'Found a red stainless steel water bottle near basketball court. Pick it up from sports office.' },
    { title: 'Lost: Blue Folder with Course Transcripts', content: 'Lost a blue plastic folder containing printed transcript sheets near admission office.' },
    { title: 'Found: Black USB Drive (32GB)', content: 'Found a SanDisk 32GB USB flash drive plugged into PC #7 in SST Lab 1.' }
  ],
  'Buy & Sell': [
    { title: 'Selling: Engineering Mathematics 10th Edition Textbook', content: 'Brand new condition book for Calculus & Linear Algebra. Price Rs. 800 (negotiable). DM if interested.' },
    { title: 'Selling: Logitech Wireless Mouse M185', content: 'Lightly used for 2 months, working perfectly with nano USB receiver. Price: Rs. 1,200.' },
    { title: 'Buying: Used Graphics Tablet (Wacom or Huion)', content: 'Looking for an affordable drawing tablet for digital design course. Budget around Rs. 4,000.' },
    { title: 'Selling: Casio Scientific Calculator fx-991ES Plus', content: '100% original Casio calculator in excellent working condition. Price: Rs. 1,800.' },
    { title: 'Selling: Course Notes for Data Structures & Algorithms', content: 'Neatly handwritten chapter summaries and solved past paper solutions for CS midterm. Rs. 400.' },
    { title: 'Selling: Hostel Wooden Study Desk & Chair', content: 'Sturdy wooden desk with drawer suitable for student room near campus. Price Rs. 3,500.' },
    { title: 'Selling: HP 24-inch Full HD Monitor', content: 'IPS 1080p 75Hz display monitor in pristine condition with HDMI cable. Price: Rs. 16,500.' },
    { title: 'Buying: Second-hand Bicycle for Campus Commute', content: 'Looking for a decent gear bicycle to travel between hostel and UMT campus.' },
    { title: 'Selling: Mechanical Gaming Keyboard (Red Switches)', content: 'RGB mechanical keyboard with quiet linear red switches. Barely used 1 month. Price: Rs. 3,200.' },
    { title: 'Selling: Laptop Backpack (Waterproof 15.6 inch)', content: 'Durable Targus padded laptop backpack with USB charging port. Price: Rs. 1,500.' }
  ]
};

async function seed() {
  try {
    console.log('Connecting to PostgreSQL database...');
    await sequelize.authenticate();

    // Ensure sample users exist
    const hashedPassword = await bcrypt.hash('password123', 10);

    const users = await Promise.all([
      User.findOrCreate({
        where: { email: 'alex@uni.edu' },
        defaults: {
          name: 'Alex Student',
          email: 'alex@uni.edu',
          password: hashedPassword,
          studentId: 'CS-2026-042',
          department: 'Computer Science (SST)',
          bio: 'CS Junior passionate about AI, Full-stack Web Dev, and Hackathons!'
        }
      }).then(([u]) => u),
      User.findOrCreate({
        where: { email: 'ammar@test2.com' },
        defaults: {
          name: 'Ammar Yasir',
          email: 'ammar@test2.com',
          password: hashedPassword,
          studentId: 'CS-2026-099',
          department: 'Software Engineering (SST)',
          bio: 'Software Dev & UMT Tech Society Lead.'
        }
      }).then(([u]) => u),
      User.findOrCreate({
        where: { email: 'ayesha@umt.edu.pk' },
        defaults: {
          name: 'Ayesha Khan',
          email: 'ayesha@umt.edu.pk',
          password: hashedPassword,
          studentId: 'BBA-2026-015',
          department: 'School of Business (HSM)',
          bio: 'Marketing enthusiast & Debating Society member.'
        }
      }).then(([u]) => u)
    ]);

    console.log(`Seeding posts across ${CATEGORIES.length} categories...`);

    let createdCount = 0;

    for (const category of CATEGORIES) {
      const postsList = SEED_DATA[category];
      for (let i = 0; i < postsList.length; i++) {
        const item = postsList[i];
        const randomUser = users[i % users.length];

        await Post.create({
          title: item.title,
          content: item.content,
          category: category,
          userId: randomUser.id,
          imageUrl: null
        });

        createdCount++;
      }
    }

    console.log(`Successfully created ${createdCount} realistic UMT posts (10 per category)!`);
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
