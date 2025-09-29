import { initializeDatabase } from "../database/db";
import { seedDatabase } from "../scripts/seed-database";

export async function initializeServerDatabase(): Promise<void> {
	try {
		// Initialize database
		initializeDatabase();

		await seedDatabase();

		setInterval(
			() => {
				seedDatabase()
			},
			60 * 60 * 1000,
		);
	} catch (error) {
		console.error("❌ Database startup failed:", error);
		throw error;
	}
}
