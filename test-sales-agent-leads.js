const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:wOhEWxYytmqxgQpJQQJnZbtBTIEffuwY@turntable.proxy.rlwy.net:33101/railway'
});

async function testSalesAgentLeads() {
  try {
    await client.connect();
    console.log('Connected to database');
    
    console.log('\n=== Testing Sales Agent Leads ===');
    
    // Get a sales agent
    const agentResult = await client.query(`
      SELECT id, "fullName", email, role
      FROM users 
      WHERE role = 'sales_person' AND "isActive" = true
      LIMIT 1;
    `);
    
    if (agentResult.rows.length === 0) {
      console.log('❌ No sales agents found');
      await client.end();
      return;
    }
    
    const agent = agentResult.rows[0];
    console.log(`Sales Agent: ${agent.fullName} (${agent.email})`);
    console.log(`Agent ID: ${agent.id}`);
    
    // Check leads assigned to this agent
    console.log('\n--- Leads Assigned to This Agent ---');
    const assignedLeadsResult = await client.query(`
      SELECT 
        id,
        "fullName",
        email,
        status,
        "assignedToUserId",
        "createdAt"
      FROM leads 
      WHERE "assignedToUserId" = $1
      ORDER BY "createdAt" DESC
      LIMIT 10
    `, [agent.id]);
    
    console.log(`Found ${assignedLeadsResult.rows.length} leads assigned to this agent:`);
    if (assignedLeadsResult.rows.length === 0) {
      console.log('  No leads assigned to this agent');
    } else {
      assignedLeadsResult.rows.forEach((lead, index) => {
        console.log(`  ${index + 1}. ${lead.fullName} (${lead.email}) - ${lead.status}`);
        console.log(`     Assigned to: ${lead.assignedToUserId}`);
        console.log(`     Created: ${lead.createdAt}`);
      });
    }
    
    // Check all leads in the system
    console.log('\n--- All Leads in System ---');
    const allLeadsResult = await client.query(`
      SELECT 
        id,
        "fullName",
        email,
        status,
        "assignedToUserId",
        "createdAt"
      FROM leads 
      ORDER BY "createdAt" DESC
      LIMIT 10
    `);
    
    console.log(`Total leads in system: ${allLeadsResult.rows.length}`);
    allLeadsResult.rows.forEach((lead, index) => {
      console.log(`  ${index + 1}. ${lead.fullName} (${lead.email}) - ${lead.status}`);
      console.log(`     Assigned to: ${lead.assignedToUserId}`);
      console.log(`     Created: ${lead.createdAt}`);
    });
    
    // Check if there are any unassigned leads
    console.log('\n--- Unassigned Leads ---');
    const unassignedLeadsResult = await client.query(`
      SELECT 
        id,
        "fullName",
        email,
        status,
        "assignedToUserId",
        "createdAt"
      FROM leads 
      WHERE "assignedToUserId" IS NULL
      ORDER BY "createdAt" DESC
      LIMIT 10
    `);
    
    console.log(`Unassigned leads: ${unassignedLeadsResult.rows.length}`);
    if (unassignedLeadsResult.rows.length > 0) {
      unassignedLeadsResult.rows.forEach((lead, index) => {
        console.log(`  ${index + 1}. ${lead.fullName} (${lead.email}) - ${lead.status}`);
        console.log(`     Assigned to: ${lead.assignedToUserId}`);
        console.log(`     Created: ${lead.createdAt}`);
      });
    }
    
    // Check sales agents
    console.log('\n--- Sales Agents ---');
    const salesAgentsResult = await client.query(`
      SELECT 
        id,
        "fullName",
        email,
        "isActive"
      FROM users 
      WHERE role = 'sales_person' AND "isActive" = true
      ORDER BY "fullName"
    `);
    
    console.log(`Active sales agents: ${salesAgentsResult.rows.length}`);
    salesAgentsResult.rows.forEach((agent, index) => {
      console.log(`  ${index + 1}. ${agent.fullName} (${agent.email}) - ID: ${agent.id}`);
    });
    
    await client.end();
  } catch (error) {
    console.error('Error:', error.message);
    await client.end();
  }
}

testSalesAgentLeads();
