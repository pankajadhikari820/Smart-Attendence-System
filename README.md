# Smart Event Check-In Application

## Overview
The Smart Event Check-In application is designed to streamline the registration and attendance process for events. It provides a user-friendly interface for both participants and organizers, allowing for efficient management of event registrations, attendance marking, and reporting.

## Features
- **Dynamic Registration Forms**: Create and manage customizable registration forms for various event types (solo/team).
- **QR Code Check-In**: Participants can check in using QR codes, which can be scanned directly or uploaded from the gallery.
- **Admin Dashboard**: Organizers can view registrations, manage attendance, and download reports in CSV format.
- **Real-Time Data Handling**: The application integrates with Firebase for real-time data updates and storage.

## Project Structure
```
smart-event-checkin
├── src
│   ├── checkin.html        # HTML structure for the check-in page
│   ├── admin.html         # Admin dashboard for managing registrations
│   ├── home.html          # Landing page for navigation
│   ├── styles.css         # CSS styles for the application
│   ├── js
│   │   ├── checkin.js     # JavaScript logic for check-in functionality
│   │   ├── admin.js       # JavaScript logic for the admin dashboard
│   │   └── form-builder.js # Logic for creating dynamic form templates
│   └── libs
│       └── html5-qrcode.min.js # Library for QR code scanning
├── server
│   ├── api.js             # Backend API logic for handling requests
│   ├── firebase-config.js  # Firebase configuration
│   └── uploads
│       └── qr-uploads     # Directory for storing uploaded QR code images
├── package.json           # npm configuration file
├── .env.example           # Template for environment variables
└── README.md              # Project documentation
```

## Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd smart-event-checkin
   ```
3. Install dependencies:
   ```
   npm install
   ```

## Usage
- Start the server:
  ```
  node server/api.js
  ```
- Open the application in your browser:
  ```
  http://localhost:3000
  ```

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.