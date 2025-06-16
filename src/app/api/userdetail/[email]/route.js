import pool from "@/config/db";
import { branchNavItem, employeeNavItems, InventoryNavItem, ownerNavItems, POSNavItem, StoreNavItem, Tools } from "@/constants/data";
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
        const result = await pool.query(query, [email]);

        const versionResult = await pool.query(`SELECT version_code, url FROM settings`)
        const version_code = versionResult.rows[0].version_code
        const route_url = versionResult.rows[0].url

        if (result.rows.length == 0) {
            return NextResponse.json({ message: "User not found, contact your manager" }, { status: 404 })
        }
        let nav_items = []
        const branchOffice = result.rows[0].office.toLowerCase()



        if (result.rows[0].full_access || result.rows[0].designation == 'Owner') {

            nav_items = [...ownerNavItems]
            nav_items.push(POSNavItem)
            nav_items.push(Tools)
            base_route = `${city ? city : branchOffice}/superadmin`
        } else {
            if (result.rows[0].designation == 'Store Manager') {
                base_route = `${branchOffice}/store`
                nav_items = [...StoreNavItem]
                nav_items.push(POSNavItem)
            } else {
                nav_items = [...employeeNavItems]
            }
            if (result.rows[0].branch_expenses_assigned)
                nav_items.push(branchNavItem)
            if (result.rows[0].inventory_assigned)
                nav_items.push(InventoryNavItem)
            if (result.rows[0].pos_assigned) {
                nav_items.push(POSNavItem)
            }
            if (result.rows[0].designation == 'Engineer') {
                base_route = `${branchOffice}/engineer`
            }
            if (result.rows[0].designation == 'Sales') {
                base_route = `${branchOffice}/sales`
            }
            if (result.rows[0].designation == 'Customer Relationship Manager') {
                base_route = `${branchOffice}/crm`
            }
            if (result.rows[0].designation == 'Customer Relationship Manager (After Sales)') {
                base_route = `${branchOffice}/aftersales`
            }
            if (result.rows[0].designation == 'Social Media Manager') {
                base_route = `${branchOffice}/smm`
            }
            if (result.rows[0].designation == 'Manager') {
                base_route = `${branchOffice}/manager`
            }




        }


        return NextResponse.json({ ...result.rows[0], nav_items: nav_items, base_route: base_route, version_code: version_code, route_url: route_url }, { status: 200 })

    } catch (error) {
        console.error('Error inserting data: ', error);
        return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
    }

}

export const revalidate = 0