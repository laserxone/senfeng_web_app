import pool, { karachi_pool } from "@/config/db";
import { branchNavItem, complaintItem, employeeNavItems, InventoryNavItem, ownerNavItems, POSNavItem, StoreNavItem, Tools } from "@/constants/data";
import { NextResponse } from "next/server";


export async function GET(req, { params }) {
    const { email } = await params
    const referrer = req.headers.get('referer')
    let city = ""
    if (referrer) {
        const url = new URL(referrer);
        const segments = url.pathname.split('/');
        city = segments[1];
    }


    try {
        const query = `
      SELECT * FROM users WHERE email = $1 LIMIT 1
    `;
        let base_route = ""
        let result = await pool.query(query, [email]);
        if (result.rows.length === 0) {
            result = await karachi_pool.query(query, [email]);
        }
        const user = result.rows[0];


        const versionResult = await pool.query(`SELECT version_code, url FROM settings`)
        const versionRow = versionResult.rows[0] || {};
        const version_code = versionRow.version_code || "";
        const route_url = versionRow.url || "";

        if (!user) {
            return NextResponse.json({ message: "User not found, contact your manager" }, { status: 404 })
        }
        let nav_items = []
        const branchOffice = (user.office || '').toLowerCase();

        if (!user.active) {
            return NextResponse.json({ message: "You are not authorized to access the system" }, { status: 404 })
        }


        if (user.full_access || user.designation == 'Owner') {

            nav_items = [...ownerNavItems]
            nav_items.push(POSNavItem)
            nav_items.push(Tools)
            base_route = `${city ? city : branchOffice}/superadmin`
        } else {
            if (user.designation == 'Store Manager') {
                base_route = `${branchOffice}/store`
                nav_items = [...StoreNavItem]
                nav_items.push(POSNavItem)
            } else {
                nav_items = [...employeeNavItems]
            }
            if (user.branch_expenses_assigned)
                nav_items.push(branchNavItem)
            // if (user.inventory_assigned)
            //     nav_items.push(InventoryNavItem)
            if (user.pos_assigned) {
                nav_items.push(POSNavItem)
            }
            if (user.complaint_assigned) {
                nav_items.push(complaintItem)
            }
            if (user.designation == 'Engineer') {
                base_route = `${branchOffice}/engineer`
            }
            if (user.designation == 'Sales') {
                base_route = `${branchOffice}/sales`
            }
            if (user.designation == 'Customer Relationship Manager') {
                base_route = `${branchOffice}/crm`
            }
            if (user.designation == 'Customer Relationship Manager (After Sales)') {
                base_route = `${branchOffice}/aftersales`
            }
            if (user.designation == 'Social Media Manager') {
                base_route = `${branchOffice}/smm`
            }
            if (user.designation == 'Manager') {
                base_route = `${branchOffice}/manager`
            }

        }

        return NextResponse.json({ ...user, nav_items: nav_items, base_route: base_route, version_code: version_code, route_url: route_url }, { status: 200 })

    } catch (error) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }

}

export const revalidate = 0