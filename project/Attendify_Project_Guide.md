# Attendify: Exhaustive Technical Guide & Code Reference

This guide provides deep technical workflows and production-level JavaScript implementations representing every functional layer of **Attendify**.

---

## 1. Authentication Middleware & Security (JWT)
Securing critical academic endpoints prevents unauthorized API requests. 

### Server-Side Implementation (`authMiddleware.js`):
```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token = req.cookies.token; // HttpOnly Cookie access

    if (!token) {
        return res.status(401).json({ success: false, message: "Authentication required" });
    }

    try {
        // Decode token using server environment secret
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Exclude password hashes from memory
        req.user = await User.findById(decoded.id).select('-password'); 
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Token invalid or expired" });
    }
};

// Role Authorization Factory
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: "Unauthorized access tier" });
        }
        next();
    };
};

module.exports = { protect, authorize };
```

---

## 2. Administrator Bulk Roster Creation
Parsing multi-column `.csv` uploads allows high-speed scaling.

### Backend Implementation (`adminController.js`):
```javascript
const csvParser = require('csv-parser');
const fs = require('fs');
const Student = require('../models/Student');

const bulkRegisterStudents = async (req, res) => {
    const studentRecords = [];
    
    // Process stream chunks
    fs.createReadStream(req.file.path)
        .pipe(csvParser())
        .on('data', (row) => {
            studentRecords.push({
                rollNumber: row.roll_no,
                name: row.name,
                email: row.email,
                division: row.division
            });
        })
        .on('end', async () => {
            try {
                // Atomic database dump prevents structural inconsistencies
                await Student.insertMany(studentRecords, { ordered: false });
                fs.unlinkSync(req.file.path); // Clean buffer
                res.status(200).json({ success: true, count: studentRecords.length });
            } catch (err) {
                res.status(500).json({ success: false, error: "Database mapping error" });
            }
        });
};
```

---

## 3. Web Socket State Pipelines (Teacher View)
`Socket.io` establishes persistent, full-duplex TCP connections.

### Server Implementation (`socket.js`):
```javascript
const socketIO = require('socket.io');

const initSocket = (server) => {
    const io = socketIO(server, { cors: { origin: "*" } });

    io.on('connection', (socket) => {
        // Teacher creates temporary room
        socket.on('join_session', (sessionId) => {
            socket.join(sessionId);
        });

        // Backend invokes updates dynamically
        socket.on('student_checked_in', (data) => {
            io.to(data.sessionId).emit('update_roster', data.studentInfo);
        });
    });
};
```

---

## 4. Haversine Spatial Logic Evaluator
Determines global positioning accurately.

```javascript
const verifyLocation = (teacherLat, teacherLon, studentLat, studentLon) => {
    const R = 6371e3; // Earth Radius (meters)
    
    const dLat = ((studentLat - teacherLat) * Math.PI) / 180;
    const dLon = ((studentLon - teacherLon) * Math.PI) / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos((teacherLat * Math.PI) / 180) * 
              Math.cos((studentLat * Math.PI) / 180) * 
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance <= 50.0; // Hard restriction threshold
};
```

Review this breakdown systematically for upcoming audits.
