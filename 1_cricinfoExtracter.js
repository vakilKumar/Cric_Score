// npm init-y
// npm install minimist
// npm install axios
// npm install jsdom
// npm install excel4node
// npm install pdf-lib
// node 1_cricinfoExtracter.js  --excel=worldcup.csv  --dataFolder=data --source=https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-results


let minimist = require("minimist");
let axios = require("axios");
let jsdom = require("jsdom");
let excel = require("excel4node");
let pdf = require("pdf-lib");
let fs = require("fs");
let path = require("path");

let args =minimist(process.argv);

// console.log(args.excel);
// console.log(args.dataFolder);

// download using axios
// extract information using jsdom
// manipulate data using array functions
// save in excel using excel4node
// creat folders and prepare pdfs

let responsekapromise = axios.get(args.source);
responsekapromise.then(function(response){
    let html = response.data;
   // console.log(html);

   let dom = new jsdom.JSDOM(html);
   let document = dom.window.document;

   let matches = [];
   let matchDivs = document.querySelectorAll("div.match-score-block");
   //console.log(matchDivs.length);

   for( let i = 0; i < matchDivs.length; i++){
       let matchDiv = matchDivs[i];

       let match = {
           t1 : "",
           t2 : "",
           t1s : "",
           t2s : "",
           result : ""
       };
      
       

       let teamparas = matchDiv.querySelectorAll("div.name-detail > p.name");
       match.t1 = teamparas[0].textContent;
       match.t2 = teamparas[1].textContent;


       let scoreSpan = matchDiv.querySelectorAll("div.score-detail > span.score");
       if( scoreSpan.length == 2){
        match.t1s = scoreSpan[0].textContent;
        match.t2s = scoreSpan[1].textContent;
       } else if( scoreSpan.length == 1){
           match.t1s = scoreSpan[0].textContent;
           match.t2s = "";
       } else {
          match.t1s = "";
          match.t2s = "";

       }


       let resultSpan = matchDiv.querySelector("div.status-text > span");
       match.result = resultSpan.textContent;

       matches.push(match);

      // console.log(matches);
   }
  

  let matchesJSON = JSON.stringify(matches);
  fs.writeFileSync("matches.json", matchesJSON, "utf-8");

  let teams = [];
  for( let i = 0; i < matches.length; i++){
      populateTeam(teams,matches[i]);
      //console.log(matches[i]);
  }

  for( let i = 0; i < matches.length; i++){
      putMatchInAppropriateTeam( teams, matches[i]);
  }

  //console.log(JSON.stringify(teams));

  let teamsJSON = JSON.stringify(teams);
  fs.writeFileSync("teams.json", teamsJSON, "utf-8");

   createExcelFile(teams);

   createFolders(teams);
})

function createFolders(teams){
    fs.mkdirSync(args.dataFolder);
    for( let i = 0; i < teams.length; i++){
        let teamFn = path.join(args.dataFolder, teams[i].name);
        fs.mkdirSync(teamFn);


        // for( let j = 0; j < teams[i].matches.length; j++){
        //     let matchFileName = path.join(teamFn,teams[i].matches[j].vs + ".pdf");
        //     createScoreCard(teams[i].name, teams[i].matches[j],matchFileName);
        // }
    } 
}

function createExcelFile(teams){
    let wb = new excel.Workbook();

    for( let i = 0; i < teams.length; i++){
       let sheet = wb.addWorksheet(teams[i].name);
       

        sheet.cell(1, 1).string("vs");
        sheet.cell(1, 2).string("Self Score");
        sheet.cell(1, 3).string("Opp Score");
        sheet.cell(1, 4).string("Result");

        for( let j = 0; j < teams[i].matches.length; j++){
            sheet.cell(2 + j, 1).string(teams[i].matches[j].vs);
            sheet.cell(2 + j, 2).string(teams[i].matches[j].selfScore);
            sheet.cell(2 + j , 3).string(teams[i].matches[j].oppScore);
            sheet.cell(2 + j, 4).string(teams[i].matches[j].result);
        }
    }
    wb.write(args.excel);
   
}


function populateTeam( teams, match){
    let t1idx = teams.findIndex(function(team){
        
        if( team.name == match.t1){
            return true;
            
        } else {
            return false;
        }
    });
//console.log(t1idx);

    if( t1idx == -1){
        let team = {
            name : match.t1,
            matches : []
        };
        teams.push(team);
    }

    let t2idx = teams.findIndex(function(team){
        if( team.name == match.t2){
            return true;
        } else {
            return false;
        }
    });

    if( t2idx == -1){
        let team = {
            name : match.t2,
            matches : []
        };
        teams.push(team);
    }
}

function putMatchInAppropriateTeam( teams, match){
    let t1idx = -1;
    for( let i = 0; i < teams.length; i++){
        if( teams[i].name == match.t1){
            t1idx = i;
            break;
        }
    }

    let team1 = teams[t1idx];
    team1.matches.push({
        vs : match.t2,
        selfScore : match.t1s,
        oppScore : match.t2s,
        result : match.result
    });

    let t2idx = -1;
    for( let i = 0; i < teams.length; i++){
        if( teams[i].name == match.t2){
            t2idx = i;
            break;
        }
    }

    let team2 = teams[t2idx];
    team2.matches.push({
        vs : match.t1,
        selfScore : match.t2s,
        oppScore : match.t1s,
        result : match.result
    });
}




