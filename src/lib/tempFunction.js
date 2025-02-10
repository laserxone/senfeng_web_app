"use server"

import pool from "@/config/db";


// Function to update the ownership of all customers
const updateCustomerOwnership = async () => {
    try {
        // Fetch all customers
        const customers = await pool.query('SELECT id FROM customer');

        for (const customer of customers.rows) {
            // Fetch all machines for the customer from the sale table, ordered by created_at DESC
            const machines = await pool.query(
                'SELECT * FROM sale WHERE customer_id = $1 ORDER BY created_at DESC',
                [customer.id]
            );

            // If there are machines, find the one with the latest created_at
            if (machines.rows.length > 0) {
                const latestMachine = machines.rows[0]; // The first row will be the latest due to ORDER BY created_at DESC

                // Update the customer's ownership with the sell_by ID from the latest machine
                await pool.query(
                    'UPDATE customer SET ownership = $1 WHERE id = $2',
                    [latestMachine.sell_by, customer.id]
                );

                console.log(`Updated customer ${customer.id} ownership to ${latestMachine.sell_by}`);
            }
        }

        console.log('Ownership update completed successfully!');
    } catch (error) {
        console.error('Error updating ownership:', error);
    }
};

export default updateCustomerOwnership;
