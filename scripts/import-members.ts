// Script to import members from members.js into Supabase
// Run with: npm run import-members

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../database-types'
import * as fs from 'fs'
import * as path from 'path'

// Load .env.local manually
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim()
      process.env[key] = value
    }
  })
}

// Import the members data
const membersContent = fs.readFileSync(path.join(process.cwd(), 'members.js'), 'utf8')
const MEMBERS = eval(membersContent + '; MEMBERS')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Found' : 'Missing')
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'Found' : 'Missing')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseKey)

// Grade mapping: "2" -> 5, "2A" -> 4, "2B" -> 3, "3" -> 2, "3A" -> 1
function convertGrade(gradeStr: string): number {
  const mapping: Record<string, number> = {
    '2': 5,
    '2A': 4,
    '2B': 3,
    '3': 2,
    '3A': 1,
  }
  return mapping[gradeStr] || 3
}

async function importMembers() {
  console.log(`Importing ${MEMBERS.length} members...`)

  const players = MEMBERS.map((member: any) => ({
    name: member.name,
    grade: convertGrade(member.grade),
    gender: member.gender as 'M' | 'F',
    nhc: member.nhc,
    plus_minus: member.plusMinus || null,
    is_active: true,
  }))

  // Insert in batches of 100
  const batchSize = 100
  let imported = 0
  let errors = 0

  for (let i = 0; i < players.length; i += batchSize) {
    const batch = players.slice(i, i + batchSize)
    
    const { data, error } = await supabase
      .from('players')
      .insert(batch)
      .select()

    if (error) {
      console.error(`Error importing batch ${i / batchSize + 1}:`, error)
      errors += batch.length
    } else {
      imported += data?.length || 0
      console.log(`Imported batch ${i / batchSize + 1}: ${data?.length} players`)
    }
  }

  console.log(`\n✅ Import complete!`)
  console.log(`   Imported: ${imported}`)
  console.log(`   Errors: ${errors}`)
  console.log(`   Total: ${MEMBERS.length}`)
}

importMembers().catch(console.error)
