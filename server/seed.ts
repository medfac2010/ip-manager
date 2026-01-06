import {db} from "./db.ts";
import { establishments, users, pcs  } from "../shared/schema.ts";
import "bcrypt";


async function seed() {
  // Check if there are any establishments
  const establishmentsCount = await db
    .select()
    .from(establishments)
    .limit(1);
    if (establishmentsCount.length > 0) {
        console.log("Database already seeded. Exiting.");
        return;
    }

  // Insert a sample establishment
  const [establishment] = await db
    .insert(establishments)
    .values({
      name: "Sample Establishment",
    });
    console.log("Inserted establishment:", establishment);
  // Insert a sample user
  const hashedPassword = await bcrypt.hash("password123", 10);  
    const [user] = await db
    .insert(users)
    .values({
      name: "admin",
      email: "sample@example.com",
      password: "admin123",
      establishmentId: establishment.id,
    });
    console.log("Inserted user:", user);
    // Insert a sample PC
    const [pc] = await db
    .insert(pcs).values({
      establishmentId: establishment.id,
      type: "desktop",
      ipAddress: "10.19.0.10",
        isIpFiltered: true,
        macAddress: "00:1A:2B:3C:4D:5E",
        officeName: "Office-PC-01",
        usersInfo: "John Doe, Jane Smith",
        installedApps: "App1, App2, App3",
        hasWindows: true,
        hasWindowsLicense: true,
        hasOffice: true,
        hasOfficeLicense: false,
        hasAntivirus: true,
        antivirusName: "Norton",
        serverServices: "",
    })
    console.log("Inserted PC:", pc);

}

seed()
  .then(() => {
    console.log("Seeding completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error during seeding:", error);
    process.exit(1);
  });
// server/seed.ts

