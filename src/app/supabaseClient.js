import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://ukuxibhujcozcwozljzf.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrdXhpYmh1amNvemN3b3psanpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4OTgzNDcsImV4cCI6MjA1NzQ3NDM0N30.4lf3cJcKq4NhyLjCYIgeUwVZFREgrbyp21UZTfJkXvI"

export const supabase = createClient(supabaseUrl, supabaseKey)