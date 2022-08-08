const express = require("express");
const cors = require("cors");
const app = express();
const port = 3001;
const mysql = require("mysql");
const fs = require("fs")
const bcrypt = require('bcrypt');
const saltRounds = 10;
const dbinfo = fs.readFileSync('./database.json');
const conf = JSON.parse(dbinfo)

const connection = mysql.createConnection({
    host: conf.host,
    user: conf.user,
    password: conf.password,
    port: conf.port,
    database:  conf.database
})
app.use(express.json());
app.use(cors());

// 회원가입 요청
app.post("/join", async (req,res)=> {
    let myPlaintextPass = req.body.userPass;
    let myPass = "";
    if(myPlaintextPass != '' && myPlaintextPass != undefined) {
        bcrypt.genSalt(saltRounds, function(err, salt) {
            bcrypt.hash(myPlaintextPass, salt, function(err, hash) {
                // Store hash in your password DB.
                myPass = hash;
                console.log(myPass);
                // 쿼리 작성
                const { userId, userName, userPost, userAdd, userAdd2, userTel, userPhone, userMail, userYear, userMonth, userDay } = req.body;
                // connection.query 인자 첫번째: 쿼리문, 두번째: 쿼리문에 들어갈 값, 세번째: 처리 되면 하는 애
                connection.query("insert into members(userId, userPass, userName, userPost, userAdd, userAdd2, userTel, userPhone, userMail, userYear, userMonth, userDay, regdate, userCoupon) values(?,?,?,?,?,?,?,?,?,?,?,?,DATE_FORMAT(now(),'%Y-%m-%d'),1)",
                    [userId, myPass, userName, userPost, userAdd, userAdd2, userTel, userPhone, userMail, userYear, userMonth, userDay],
                    (err, result, fields) => {
                        console.log(result)
                        console.log(err)
                        res.send("등록되었습니다.")
                    }
                )
            });
        });
    }
})

// 회원가입 id 중복 확인
app.get('/idCh', async (req,res)=>{
    connection.query(
        "select userId from members",
        (err, rows, fields)=> {
            res.send(rows)
        }
    )
})

// 로그인
app.get('/getId/:id', async (req,res)=>{
    const params = req.params;
    const { id } = params;
    connection.query(
        `select userId from members where userId='${id}'`,
        (err, rows, fields)=>{
            res.send(rows);
        }
    )
})

// 로그인 요청
app.post('/login', async (req, res)=> {
    const {userId, userPass} = req.body;
    connection.query(`select * from members where userId = '${userId}'`,
        (err, rows, fileds)=>{
            if(rows != undefined) {
                if(rows[0] == undefined) {
                    res.send(null)
                } else {
                    // Load hash from your password DB.
                    bcrypt.compare(userPass, rows[0].userPass, function(err, result) {
                        // result == true
                        if(result == true) {
                            res.send(rows[0])
                        } else {
                            res.send('실패')
                        }
                    });
                }
            } else {
                res.send('실패')
            }
        }
    )
})

// 메인에 보내기 
// visual
app.get('/visuals', async (req, res)=> {
    connection.query(
        "select * from visual",
        (err, rows, fields)=> {
            res.send(rows)
        }
    )
})
// recommand
app.get('/recommands', async (req, res)=> {
    connection.query(
        "select * from recommand",
        (err, rows, fields)=> {
            res.send(rows)
        }
    )
})
// pic
app.get('/pics', async (req, res)=> {
    connection.query(
        "select * from pics",
        (err, rows, fields)=> {
            res.send(rows)
        }
    )
})

// 모든 장소 모아보기
// destinations
app.get('/trips', async (req, res)=> {
    connection.query(
        "select * from trip order by cityNational ASC",
        (err, rows, fields)=> {
            res.send(rows)
        }
    )
})

// 검색 기능
app.get('/trips', async (req, res)=> {
    connection.query(
        `select * from trip where=`,
        (err, rows, fields)=> {
            res.send(rows)
        }
    )
})

// 서버실행
app.listen(port, () => {
    console.log("고객 서버가 돌아가고 있습니다.")
})