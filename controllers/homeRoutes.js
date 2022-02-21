const router = require("express").Router();
const {
  User,
  Project,
  usersToProjects,
  List,
  Task,
  Note,
} = require("../models");
//add Project

router.get("/", async (req, res) => {
  res.render("homepage");
});

router.get("/users", async (req, res) => {
  try {
    const userData = await User.findByPk(req.session.user_id, {
      attributes: { exclude: ["password"] },
      include: [{ model: Project }],
    });
    const user = userData.get({ plain: true });
    const userProjects = user.projects;
    const first = req.session.first_name.split("")[0];
    const noteData = await Note.findAll({
      where: {
        user_id: req.session.user_id,
      },
    });
    const notes = noteData.map((note) => note.get({ plain: true }));
    console.log(userProjects);
    console.log(user);
    res.render("projects-dashboard", {
      user,
      userName: req.session.first_name,
      user_id: userProjects.id,
      userid: req.session.user_id,
      first,
      notes,
      logged_in: true,
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get("/project", async (req, res) => {
  console.log(req.originalUrl);
  const num = req.originalUrl.split("=")[1];
  console.log(num);
  try {
    const userData = await User.findByPk(req.session.user_id, {
      attributes: { exclude: ["password"] },
      include: [{ model: Project }],
    });
    const listData = await List.findAll({
      where: { project_id: num },
      include: [{ model: Task }],
      order: [["position", "ASC"]],
    });
    const projectData = await usersToProjects.findAll({
      where: { project_id: num },
      // include: [{model: User, attributes: {exclude:'password'}}]
    })
    let userIDs = projectData.map(project => project.get({ plain: true }))
    let userIDsArray = userIDs.map(user => user.user_id)
    console.log('=======================')
    console.log(userIDsArray)
    console.log('=======================')

    const membersArray = []
    
    for (let i = 0; i<userIDsArray.length; i++) {
      const usersData = await User.findByPk(userIDsArray[i], {
        attributes: { exclude: 'password' }
      })
      let firstName = usersData.get({ plain: true }).first_name
      let lastName = usersData.get({ plain: true }).last_name
      membersArray.push(`${firstName} ${lastName}`)
      // membersArray.push(`${firstName} ${lastName}`)
      // console.log(membersArray)
  }
    // console.log(membersArray)

  // const taskData = await Task.findAll({ where: { list_id: 7 } });
  const user = userData.get({ plain: true });
  const lists = listData.map((list) => list.get({ plain: true }));
  // const tasks = taskData.map((task) => task.get({ plain: true }));
  // console.log(lists);
  // console.log(user);
  const project = user.projects
  const title = project.find((pro) => {
    // console.log(pro)
    return pro.id === parseInt(num)
  })
  // console.log(title)
  // console.log(project)
  const first = req.session.first_name.split("")[0];
  res.render("project", {
    lists,
    ...user,
    first,
    title,
    logged_in: true,
    membersArray,
  });
} catch (err) {
  res.status(500).json(err);
}
});

router.get("/login", async (req, res) => {
  if (req.session.logged_in) {
    res.redirect("/users");
    return;
  }
  res.render("login");
});

router.get("/signup", async (req, res) => {
  if (req.session.logged_in) {
    res.redirect("/users");
    return;
  }
  res.render("signup");
});
module.exports = router;