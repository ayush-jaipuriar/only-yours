# OnlyYours: A Full-Stack Application

OnlyYours is a full-stack application featuring a mobile client built with React Native and a backend powered by Spring Boot. This project serves as a template or starting point for applications requiring user authentication and a client-server architecture.

## Features

- **User Authentication:** Secure sign-in using Google Sign-In.
- **Client-Server Architecture:** A clear separation of concerns between the mobile client and the backend server.
- **REST API:** A RESTful API for communication between the client and the server.
- **Database Migrations:** Database schema management using Flyway.

## Tech Stack

### Frontend
- **React Native:** A framework for building native mobile apps using React. See the decision record: [Frontend Stack Decision](./FRONTEND_DECISION.md).
- **React Navigation:** For routing and navigation.
- **Axios:** For making HTTP requests to the backend.
- **Google Sign-In:** For user authentication.

### Backend
- **Spring Boot:** A framework for building Java-based web applications.
- **Spring Security:** For authentication and authorization.
- **Spring Data JPA:** For database access.
- **PostgreSQL:** A powerful, open-source object-relational database system.
- **Flyway:** For database migrations.
- **JWT:** For token-based authentication.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **Yarn**
- **Java Development Kit (JDK)** (version 17)
- **PostgreSQL**
- **Android Studio** or **Xcode** for mobile development

## Getting Started

Follow these instructions to get the project up and running on your local machine.

### Backend Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/only-yours.git
    cd only-yours/backend
    ```

2.  **Create a PostgreSQL database:**
    - Create a new database named `onlyyours`.

3.  **Configure the application:**
    - Open `src/main/resources/application.properties`.
    - Update the `spring.datasource.username` and `spring.datasource.password` with your PostgreSQL credentials.
    - Set `google.client.id` to your Google Client ID.
    - Replace `your_super_secret_key_which_should_be_long_and_random` with a strong secret for `jwt.secret`.

### Frontend Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd ../OnlyYoursApp
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure the application:**
    - Open `App.js`.
    - Replace `'your_web_client_id.apps.googleusercontent.com'` with your Google Web Client ID.

4.  **For iOS, install pods:**
    ```bash
    cd ios
    pod install
    ```

## Running the Application

### Backend

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Run the Spring Boot application:**
    ```bash
    ./gradlew bootRun
    ```
    The backend will start on `http://localhost:8080`.

### Frontend

1.  **Navigate to the frontend directory:**
    ```bash
    cd OnlyYoursApp
    ```

2.  **Start the Metro bundler:**
    ```bash
    npm start
    ```

3.  **Run on Android or iOS:**
    - In a new terminal, run one of the following commands:
      ```bash
      npm run android
      ```
      or
      ```bash
      npm run ios
      ```

## Running Tests

### Backend

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Run the tests:**
    ```bash
    ./gradlew test
    ```

### Frontend

1.  **Navigate to the frontend directory:**
    ```bash
    cd OnlyYoursApp
    ```

2.  **Run the tests:**
    ```bash
    npm test
    ```
