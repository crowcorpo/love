import {createClient} from "@supabase/supabase-js";

export const supabase = createClient(
    "https://kxtoxbeloyxvdgsckoyi.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4dG94YmVsb3l4dmRnc2Nrb3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MzkxMTEsImV4cCI6MjA3MzUxNTExMX0.6hDK8aoA__NP5if5bNsziQ1XhGqNCAOzJUuSZJmlS90"
)