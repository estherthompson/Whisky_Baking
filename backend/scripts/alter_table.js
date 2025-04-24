import supabase from '../config/supabaseClient.js';
import fs from 'fs';
import path from 'path';

const runAlterTable = async () => {
    try {
        // Read the SQL file
        const sqlPath = path.join(__dirname, '../sql/alter_user_account.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Execute the SQL
        const { error } = await supabase.rpc('exec_sql', { sql });

        if (error) {
            console.error('Error executing SQL:', error);
            return;
        }

        console.log('Table altered successfully!');
    } catch (error) {
        console.error('Error:', error);
    }
};

runAlterTable(); 