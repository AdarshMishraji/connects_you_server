import { Router } from "express";
import { Pool } from "pg";
import { fetchRoomsForUser } from "../helpers";

const app = Router();

app.get("/1", (req, res) => {
  res.send("hi");
});
app.get("/2", async (req, res) => {
  const db: Pool = res.locals.db;
  // const client = await db.connect();

  //   const data = await createDuetRoomIfNotExists(
  //     "6143a49b-de5b-4f73-af90-e9828d2998a1",
  //     "aadbf987-a3c5-46fe-8e51-7e34e0e519b0",
  //     db
  //   );
  // const query = `SELECT
  //                     r2.*
  //                   FROM
  //                     ${TableNames.ROOM_USERS} r1
  //                   JOIN
  //                     ${TableNames.ROOM_USERS} r2
  //                   ON
  //                     r1."roomId" = r2."roomId"
  //                   AND
  //                     r1."userId" <> r2."userId"
  //                   AND
  //                     r1."userId" = '6143a49b-de5b-4f73-af90-e9828d2998a1'
  //                   AND
  //                     r2."userId" = 'aadbf987-a3c5-46fe-8e51-7e34e0e519b0'
  //                   AND
  //                     r1."userRole" IN ('${RoomUserTypes.DUET_CREATOR}', '${RoomUserTypes.DUET_NORMAL}')
  //                   AND
  //                     r2."userRole" IN ('${RoomUserTypes.DUET_CREATOR}', '${RoomUserTypes.DUET_NORMAL}')
  //                   `;
  try {
    const data = await fetchRoomsForUser(
      "6143a49b-de5b-4f73-af90-e9828d2998a1",
      "1654491993381",
      db
    );
    // await client.query(
    //   `BEGIN; SELECT public.fetch_rooms_and_users('6143a49b-de5b-4f73-af90-e9828d2998a1','${ENVs.SECRET}', null, 'Ref1', 'Ref2')`
    // );
    // const ref1 = await client.query('FETCH ALL IN "Ref1"');
    // const ref2 = await client.query('FETCH ALL IN "Ref2"; COMMIT;');
    // await client.release();
    res.json(data);
  } catch (e) {
    console.log(e);
    // await client.release();
  }
});

export const testRoutes = app;
