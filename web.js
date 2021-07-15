const express = require("express");
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use("/js", express.static(__dirname + "/js"));
app.use("/public", express.static("public"));
const MongoClient = require("mongodb").MongoClient;
const methodOverride = require("method-override");
app.use(methodOverride("_method"));
app.set("views", __dirname + "/views");
var db;
require("dotenv").config();
MongoClient.connect(
  process.env.DB_URL,
  { useUnifiedTopology: true },
  function (에러, client) {
    if (에러) {
      return console.log(에러);
    }
    db = client.db("IrumWorkflow");
    app.listen(process.env.PORT, function () {
      console.log(`listening on port ${process.env.PORT}`);
    });
  }
);
app.set("view engine", "ejs");
// ejs 사용 코드

app.get("/", function (요청, 응답) {
  응답.render("index.ejs");
});

// 마지막 진도

app.post("/modelListAdd", function (요청, 응답) {
  db.collection("counter").findOne(
    { name: "모델리스트갯수" },
    function (에러, 결과) {
      var 총게시물갯수 = 결과.totalPost;
      db.collection("modelList").insertOne(
        {
          _id: 총게시물갯수 + 1,
          modelName: 요청.body.modelName,
          description: 요청.body.description,
        },
        function (에러, 결과) {
          console.log("저장완료");
          db.collection("counter").updateOne(
            { name: "모델리스트갯수" },
            { $inc: { totalPost: 1 } },
            function (에러, 결과) {
              if (에러) {
                return console.log(에러);
              }
              응답.redirect("/modelList");
            }
          );
        }
      );
    }
  ); //name이 '게시물 갯수'인 데이터를 하나 찾아주세요
});

// app.get("/modelList", function (요청, 응답) {
//   응답.sendFile(__dirname + "/modelList.html");
// });
app.get("/modelList", function (요청, 응답) {
  db.collection("modelList")
    .find()
    .toArray(function (에러, 결과) {
      console.log(결과);
      응답.render("modelList.ejs", { dbModelList: 결과 });
    });
});

app.delete("/delete", function (요청, 응답) {
  console.log(요청.body);
  요청.body._id = parseInt(요청.body._id);
  db.collection("modelList").deleteOne(요청.body, function (에러, 결과) {
    console.log("삭제완료");
    응답.status(200).send({ message: "성공했습니다" });
  });
});

app.get("/detail/:id", function (요청, 응답) {
  db.collection("modelList").findOne(
    { _id: parseInt(요청.params.id) },
    function (에러, 결과) {
      if (에러) {
        응답.send("Page not Found");
      }
      응답.render("detail.ejs", { data: 결과 });
    }
  );
});

// app.put("/put",function(요청,응답){
//   db.collection("modelList").updateOne(요청.body)
// })
app.get("/edit/:id", function (요청, 응답) {
  db.collection("modelList").findOne(
    { _id: parseInt(요청.params.id) },
    function (에러, 결과) {
      // if (에러 === null) {
      //   // 응답.send("Page not Found");
      // }
      응답.render("edit.ejs", { dbmodelList: 결과 });
    }
  );
});

app.put("/edit", function (요청, 응답) {
  db.collection("modelList").updateOne(
    { _id: parseInt(요청.body.id) },
    {
      $set: {
        modelName: 요청.body.modelName,
        description: 요청.body.description,
      },
    },
    function (에러, 결과) {
      console.log("수정완료");
      응답.redirect("/modelList");
    }
  );
  // 폼에담긴 이름, 설명 데이터를
  // db에 아이디 검색해서 그거인걸로 대체해주세요
});

//로그인
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");

app.use(
  session({ secret: "비밀코드", resave: true, saveUninitialized: false })
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/login", function (요청, 응답) {
  응답.render("login.ejs");
});

app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
  }),
  function (요청, 응답) {
    응답.redirect("/");
  }
);

passport.use(
  new LocalStrategy(
    {
      usernameField: "id",
      passwordField: "pw",
      session: true,
      passReqToCallback: false,
    },
    function (입력한아이디, 입력한비번, done) {
      //console.log(입력한아이디, 입력한비번);
      db.collection("login").findOne(
        { id: 입력한아이디 },
        function (에러, 결과) {
          if (에러) return done(에러);

          if (!결과)
            return done(null, false, { message: "존재하지않는 아이디요" });
          if (입력한비번 == 결과.pw) {
            return done(null, 결과);
          } else {
            return done(null, false, { message: "비번틀렸어요" });
          }
        }
      );
    }
  )
);

app.get("/mypage", loginCheck, function (요청, 응답) {
  응답.render("mypage.ejs", { user: 요청.user });
});

function loginCheck(요청, 응답, next) {
  console.log(요청.user);
  if (요청.user) {
    next();
  } else {
    응답.redirect("/login");
  }
}

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (아이디, done) {
  db.collection("login").findOne({ id: 아이디 }, function (에러, 결과) {
    done(null, 결과);
  });
});

app.get("/logout", function (요청, 응답) {
  요청.logout();
  응답.redirect("/");
});

//purchase.ejs
app.get("/purchase", loginCheck, function (요청, 응답) {
  응답.render("purchase.ejs", {});
});
