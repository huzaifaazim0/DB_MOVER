var express = require('express');
var router = express.Router();
const mysql = require('mysql2/promise');
var XLSX = require("xlsx");
var fs = require('fs'); 
var path = require('path');




var connection;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/connection', async (req,res, next)=>{
  console.log("POST /connection ", req.body)
  try {
    connection = await mysql.createConnection({
      host: req.body.hostname == "localhost" ? "127.0.0.1" : req.body.hostname,
      user: req.body.username,
      password: req.body.password,
      database: req.body.database
    })

    const [rows, fields] = await connection.query('SHOW TABLES;')
    // console.log(rows)
    let r = []
    for (const item of rows) {
      // Get the first value in each object and add it to the outputArray
      const values = Object.values(item);
      if (values.length > 0) {
        r.push(values[0]);
      }
    }
    console.log(r)
    res.json({status : true, tables : r})

  } catch (error) {
    console.log(error)
    res.json({status : false, error})
  }


// simple query

})

router.post('/upload/file', async (req,res)=>{
  console.log(req.files)
  try {
		const files = req.files; // 'files' should be the property name corresponding to the input field name
	
		const uploadedFiles = [];
	
		for (const key of Object.keys(files)) {
		  const file = files[key];
		  if (file.mimetype !== "text/csv" && file.mimetype !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" && file.mimetype == "application/vnd.ms-excel" ) {
        return res.status(400).json({ error: "Input file type not supported. Only use CSV, XLS and XLSX" });
		  }
	
		  const pathToFile = path.join(__dirname, "../public/files", `${Date.now()}_${file.name}`);
			
		  await file.mv(pathToFile);

      // await new Promise(resolve => setTimeout(resolve, 5000));

      var workbook = XLSX.readFile(pathToFile, {});

      // Get the names of all sheets in the Excel file
      const sheetNames = workbook.SheetNames;

      // Access a specific sheet by name (e.g., the first sheet)
      const firstSheetName = sheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Parse the data from the sheet
      let data = XLSX.utils.sheet_to_json(worksheet);
      data = data[0]
      const keys = Object.keys(data);


      console.log(req.body)
      connection = await mysql.createConnection({
        host: req.body.host == "localhost" ? "127.0.0.1" : req.body.host,
        user: req.body.user,
        password: req.body.pass,
        database: req.body.db
      })
  
      const [rows, fields] = await connection.query(`SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = '${req.body.db}'
      AND table_name = '${req.body.table}'`)
      // console.log(rows)
      let r = []
      for (const item of rows) {
        // Get the first value in each object and add it to the outputArray
        const values = Object.values(item);
        if (values.length > 0) {
          r.push(values[0]);
        }
      }
      console.log(r)
      

      res.json({ status : true, keys, columns : r, pathToFile });
	  }
  } catch (error) {
		console.log("Error:", error.message);
		res.status(500).json({ error: "An error occurred." });
	  }
})


router.post('/import',async (req,res)=>{
  console.log(req.body)
  mappings = {}
  for (const key in req.body) {
    if(key.includes('columns')){
      const newKey = key.replace('columns[', '').replace(']', '');
      mappings[newKey] = req.body[key];
    }
  }
  console.log(mappings)

  var workbook = XLSX.readFile(req.body.pathToFile, {});
  const sheetNames = workbook.SheetNames;

  // Access a specific sheet by name (e.g., the first sheet)
  const firstSheetName = sheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Parse the data from the sheet
  let data = XLSX.utils.sheet_to_json(worksheet);
  // for (let index = 0; index < data.length; index++) {
    const insertQuery = `INSERT INTO ${req.body.db_conf_table_name} (${Object.keys(mappings).join(', ')}) VALUES ${data.map(data => `(${Object.values(mappings).map(mappedColumn => `'${data[mappedColumn]}'`).join(', ')})`).join(', ')};`;

    connection = await mysql.createConnection({
      host: req.body.db_conf_table_host == "localhost" ? "127.0.0.1" : req.body.db_conf_table_host,
      user: req.body.db_conf_table_user,
      password: req.body.db_conf_table_pass,
      database: req.body.db_conf_table_db
    })

    try {
      const [rows, fields] = await connection.query(insertQuery)
      res.json({status :true})
      
    } catch (error) {
      res.json({status :false,error})
    }
  // }
})

router.post('/export',async (req,res)=>{

    const selectQuery = `SELECT * FROM ${req.body.table};`;

    connection = await mysql.createConnection({
      host: req.body.host == "localhost" ? "127.0.0.1" : req.body.host,
      user: req.body.user,
      password: req.body.pass,
      database: req.body.db
    })

    try {
      const [rows, fields] = await connection.query(selectQuery)
      
      // Extract headers from the first object's keys
      csvData = []
      const headers = Object.keys(rows[0]);
      
      csvData.push(headers);
      
      rows.forEach(record => {
        const row = headers.map(header => record[header]);
        csvData.push(row);
      });
      
      let filePath = './export-'+Date.now()+'.csv';
      const csvContent = csvData.map(row => row.join(',')).join('\n');
      
      fs.writeFileSync(filePath, csvContent, 'utf-8');
      

      res.download(filePath, 'data.csv',(err)=>{
        if(err){
          res.json({status :false,error})
        }else{
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error('Error deleting file:', err);
            } else {
              console.log('Temporary file deleted');
            }
          });
        }
      })
     
      
    } catch (error) {
      console.log(error)
      res.json({status :false,error})
    }
})


module.exports = router;
