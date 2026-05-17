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
    depth: string;
}
async function addPlayer(data: CreatePlayerInput): Promise<Player| null> {
    try {
        let player = await Player.findOne({
            where: { mlbPlayerId: String(data.mlbPlayerId) }
        });

        if (player) {
            player.firstName = data.firstName;
            player.lastName = data.lastName;
            player.age = data.age;
            player.status = data.status;
            player.realTeam = data.realTeam;
            player.realLeague = data.realLeague;
            player.depth = data.depth;

            player.lastYearStats = {
                ...(player.lastYearStats || {}),
                ...(data.lastYearStats || {})
            }
            player.threeYearAvg = {
                ...(player.threeYearAvg || {}),
                ...(data.threeYearAvg || {})
            }
            player.projectedStats = {
                ...(player.projectedStats || {}),
                ...(data.projectedStats || {})
            }
            // Save updates
            await player.save();
            return player;
        }

        const newPlayer = await Player.create({
            mlbPlayerId: data.mlbPlayerId,
            age: data.age,
            firstName: data.firstName,
            lastName: data.lastName,
            isHitter: data.isHitter,
            playablePositions: data.playablePositions, // DO NOT TOUCH LATER
            lastYearStats: data.lastYearStats ?? {},
            threeYearAvg: data.threeYearAvg ?? {},
            projectedStats: data.projectedStats ?? {},
            status: data.status,
            seasonsLeft: data.seasonsLeft,
            realTeam: data.realTeam,
            realLeague: data.realLeague,
            depth: data.depth,
        });

        if(!newPlayer){
            console.log("issue")
            return null;
        }
        return newPlayer;
    } catch (error) {
        // console.error("Error creating player:", error);
        throw error;
    }
}
// ['SS' '1B' 'RF' 'CF' 'C' '3B' '2B' 'P' 'OF' 'LF' 'DH' 'TWP']

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
    RF: Position.RIGHTFIELD,
    CF: Position.CENTERFIELD,
    LF: Position.LEFTFIELD,
    DH: Position.HITTER,
    TWP: Position.TWOWAY
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
            status: (row.Tm == "minors" ? Status.MINORS : Status.ACTIVE), 
            seasonsLeft: 1, // placeholder (you can adjust later)

            realTeam: row.team_abbr,
            realLeague: row.Lev === "Maj-AL" ? "AL" : "NL",
            depth: row.depth
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
            status: (row.Tm == "minors" ? Status.MINORS : Status.ACTIVE), 
            seasonsLeft: 1, // placeholder
            realTeam: row.team_abbr,
            realLeague: row.Lev === "Maj-AL" ? "AL" : "NL",
            depth: row.depth,
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
ingestHitters("./python/rsrc/minordata.csv")
  .then(() => console.log("Done"))
  .catch((err) => console.error("Error:", err));
ingestPitchers("./python/rsrc/minorpdata.csv")
  .then(() => console.log("Done"))
  .catch((err) => console.error("Error:", err));
ingestHitters("./python/rsrc/batting_3avg.csv")
  .then(() => console.log("Done"))
  .catch((err) => console.error("Error:", err));
ingestPitchers("./python/rsrc/pitching_3avg.csv")
  .then(() => console.log("Done"))
  .catch((err) => console.error("Error:", err));
