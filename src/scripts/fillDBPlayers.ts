import Player, { Position, Status } from '../models/player';
import { parse } from "csv-parse/sync";
import readline from "readline";
import csv from "csv-parser";
import fs from "fs";
// run with npx ts-node src/scripts/fillDBPlayers.ts
//from backend dir only
interface CreatePlayerInput {
    mlbPlayerId: number;
    age: number;
    firstName: string;
    lastName: string;
    isHitter: boolean;
    playablePositions: Position[];
    lastYearStats?: Record<string, number>;
    threeYearAvg?: Record<string, number>;
    projectedStats?: Record<string, number>;
    status: Status;
    seasonsLeft: number;
    realTeam: string;
    realLeague: string;
}
async function addPlayer(data: CreatePlayerInput): Promise<Player| null> {
    try {
        const now = new Date();

        const player = await Player.create({
            mlbPlayerId: data.mlbPlayerId,
            age: data.age,
            firstName: data.firstName,
            lastName: data.lastName,
            isHitter: data.isHitter,
            playablePositions: data.playablePositions,
            lastYearStats: data.lastYearStats ?? {},
            threeYearAvg: data.threeYearAvg ?? {},
            projectedStats: data.projectedStats ?? {},
            status: data.status,
            seasonsLeft: data.seasonsLeft,
            realTeam: data.realTeam,
            realLeague: data.realLeague,
        });
        if(!player){
            console.log("issue")
            return null;
        }
        return player;
    } catch (error) {
        // console.error("Error creating player:", error);
        throw error;
    }
}
function mapPosition(pos: string): Position {
  const map: Record<string, Position> = {
    C: Position.CATCHER,
    "1B": Position.FIRST,
    "2B": Position.SECOND,
    "3B": Position.THIRD,
    SS: Position.SHORTSTOP,
    OF: Position.OUTFIELD,
    P: Position.PITCHER,
    U: Position.UTILITY,
  };
  return map[pos] ?? Position.UTILITY;
}

const fixEncoding = (str: string) => { //used AI for this function
  return str
    .replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .split('')
    .map(c => c.charCodeAt(0))
    .reduce((buf, byte) => Buffer.concat([buf, Buffer.from([byte])]), Buffer.alloc(0))
    .toString('utf8');
};

async function ingestHitters(csvPath: string) {
  const players: any[] = [];

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on("data", (row) => {
        try {
          // Split name
          const name = fixEncoding(row.Name)
          console.log(name)
          const [firstName, ...rest] = name.split(" ");
          const lastName = rest.join(" ");

          const playerData: CreatePlayerInput = {
            mlbPlayerId: Number(row.mlbID),
            age: Number(row.Age),
            firstName,
            lastName,
            isHitter: true,
            playablePositions: [mapPosition(row.position)],

            lastYearStats: {
              PA: Number(row.PA),
              AB: Number(row.AB),
              R: Number(row.R),
              H: Number(row.H),
              "1B": Number(row["1B"]),
              "2B": Number(row["2B"]),
              "3B": Number(row["3B"]),
              HR: Number(row.HR),
              RBI: Number(row.RBI),
              BB: Number(row.BB),
              K: Number(row.K),
              SB: Number(row.SB),
              CS: Number(row.CS),
              AVG: Number(row.AVG),
              OBP: Number(row.OBP),
              SLG: Number(row.SLG),
            },
            threeYearAvg: {
                PA: Number(row.PA),
                AB: Number(row.AB),
                R: Number(row.R),
                H: Number(row.H),
                "1B": Number(row["1B"]),
                "2B": Number(row["2B"]),
                "3B": Number(row["3B"]),
                HR: Number(row.HR),
                RBI: Number(row.RBI),
                BB: Number(row.BB),
                K: Number(row.K),
                SB: Number(row.SB),
                CS: Number(row.CS),
                AVG: Number(row.AVG),
                OBP: Number(row.OBP),
                SLG: Number(row.SLG),
            }, 
            projectedStats: {
                PA: Number(row.PA),
                AB: Number(row.AB),
                R: Number(row.R),
                H: Number(row.H),
                "1B": Number(row["1B"]),
                "2B": Number(row["2B"]),
                "3B": Number(row["3B"]),
                HR: Number(row.HR),
                RBI: Number(row.RBI),
                BB: Number(row.BB),
                K: Number(row.K),
                SB: Number(row.SB),
                CS: Number(row.CS),
                AVG: Number(row.AVG),
                OBP: Number(row.OBP),
                SLG: Number(row.SLG),
            }, 
            status: Status.ACTIVE, 
            seasonsLeft: 1, // placeholder (you can adjust later)

            realTeam: row.team_abbr,
            realLeague: row.Lev === "Maj-AL" ? "AL" : "NL",
          };

          players.push(playerData);
        } catch (err) {
          // console.error("Error parsing row:", row, err);
        }
      })
      .on("end", async () => {
        console.log(`Parsed ${players.length} players`);

        for (const p of players) {
          try {
            await addPlayer(p);
          } catch (err) {
            // console.error("Failed to insert player:", p.firstName, p.lastName);
          }
        }

        console.log("Done inserting players");
        resolve();
      })
      .on("error", reject);
  });
}
async function ingestPitchers(csvPath: string) {
  const pitchers: CreatePlayerInput[] = [];

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on("data", (row) => {
        try {
          // Split name
          const name = fixEncoding(row.Name)
          const [firstName, ...rest] = name.split(" ");
          const lastName = rest.join(" ");

          const pitcherData: CreatePlayerInput = {
            mlbPlayerId: Number(row.mlbID),
            age: Number(row.Age),
            firstName,
            lastName,
            isHitter: false,
            playablePositions: [Position.PITCHER], // All pitchers

            lastYearStats: {
              G: Number(row.G),
              GS: Number(row.GS),
              W: Number(row.W),
              SV: Number(row.SV),
              IP: parseFloat(row.IP) || 0,
              H: Number(row.H),
              ER: Number(row.ER),
              BB: Number(row.BB),
              SO: Number(row.SO),
              HR: Number(row.HR),
              ERA: parseFloat(row.ERA) || 0,
              WHIP: parseFloat(row.WHIP) || 0,
              BF: Number(row.BF),
              "SO/W": parseFloat(row["SO/W"]) || 0,
              SB: Number(row.SB),
              PO: Number(row.PO),
            },
            threeYearAvg: {
              G: Number(row.G),
              GS: Number(row.GS),
              W: Number(row.W),
              SV: Number(row.SV),
              IP: parseFloat(row.IP) || 0,
              H: Number(row.H),
              ER: Number(row.ER),
              BB: Number(row.BB),
              SO: Number(row.SO),
              HR: Number(row.HR),
              ERA: parseFloat(row.ERA) || 0,
              WHIP: parseFloat(row.WHIP) || 0,
              BF: Number(row.BF),
              "SO/W": parseFloat(row["SO/W"]) || 0,
              SB: Number(row.SB),
              PO: Number(row.PO),
            },
            projectedStats: {
              G: Number(row.G),
              GS: Number(row.GS),
              W: Number(row.W),
              SV: Number(row.SV),
              IP: parseFloat(row.IP) || 0,
              H: Number(row.H),
              ER: Number(row.ER),
              BB: Number(row.BB),
              SO: Number(row.SO),
              HR: Number(row.HR),
              ERA: parseFloat(row.ERA) || 0,
              WHIP: parseFloat(row.WHIP) || 0,
              BF: Number(row.BF),
              "SO/W": parseFloat(row["SO/W"]) || 0,
              SB: Number(row.SB),
              PO: Number(row.PO),
            },
            status: Status.ACTIVE,
            seasonsLeft: 1, // placeholder
            realTeam: row.team_abbr,
            realLeague: row.Lev === "Maj-AL" ? "AL" : "NL",
          };

          pitchers.push(pitcherData);
        } catch (err) {
          console.error("Error parsing row:", row, err);
        }
      })
      .on("end", async () => {
        console.log(`Parsed ${pitchers.length} pitchers`);

        for (const p of pitchers) {
          try {
            await addPlayer(p);
          } catch (err) {
            console.error("Failed to insert pitcher:", p.firstName, p.lastName, err);
          }
        }

        console.log("Done inserting pitchers");
        resolve();
      })
      .on("error", reject);
  });
}
ingestHitters("./python/data.csv")
  .then(() => console.log("Done"))
  .catch((err) => console.error("Error:", err));
ingestPitchers("./python/pdata.csv")
  .then(() => console.log("Done"))
  .catch((err) => console.error("Error:", err));
