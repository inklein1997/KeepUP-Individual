const path = require("path");
const express = require("express");
const http = require("http");
const session = require("express-session");
const exphbs = require("express-handlebars");
const routes = require("./controllers");
const helpers = require("./utils/helpers");
const socketio = require("socket.io");
const Filter = require("bad-words");
const Sequelize = require('sequelize')
const {
  generateMessage,
  generateLocationMessage,
} = require('./utils/messages');
const {
  addUser,
  removeUser,
  getUser,
  getUserInRoom,
} = require('./utils/users');

const sequelize = require("./config/connection");
const SequelizeStore = require("connect-session-sequelize")(session.Store);

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const PORT = process.env.PORT || 3001;

const hbs = exphbs.create({ helpers });



// sequelize.define("sessions", {
//   sid: {
//     type: Sequelize.STRING,
//     primaryKey: true,
//   },
//   userId: Sequelize.STRING,
//   expires: Sequelize.DATE,
//   data: Sequelize.TEXT,
// });

function extendDefaultFields(defaults, session) {
  return {
    data: defaults.data,
    expires: defaults.expires,
    userId: session.userId,
  };
}


const sess = {
  secret: "Super secret secret",
  cookie: {
    maxAge: 600000
  },
  resave: false,
  saveUninitialized: true,
  store: new SequelizeStore({
    db: sequelize,
    // table: "sessions",
    extendDefaultFields: extendDefaultFields,
  }),
};

app.use(session(sess));

app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(routes);

io.on("connection", (socket) => {
  console.log("new websocket connection");

  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });
      
    if (error) {
      return callback(error);
    }

    socket.join(user.room);

    socket.emit("message", generateMessage("Admin", "Welcome!"));
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        generateMessage("Admin", `${user.username} has joined!`)
      );
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUserInRoom(user.room),
    });
    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    console.log(user);
    const filter = new Filter();

    if (filter.isProfane(message)) {
      return callback("Profanity is not allowed");
    }
    io.to(user.room).emit("message", generateMessage(user.username, message));
    callback();
  });

  socket.on("sendLocation", (coords, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(
        user.username,
        `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`
      )
    );
    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage("Admin", `${user.username} has left`)
      );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUserInRoom(user.room),
      });
    }
  });
});

sequelize.sync({ force: false }).then(() => {
  server.listen(PORT, () => console.log("Now listening"));
});
