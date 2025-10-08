@echo off
echo Sincronizando schema do Prisma com banco de dados...
echo.
set DATABASE_URL=postgresql://postgres:vVXc3lnDsmy7QgMK@db.inyrnjdefirzgamnmufi.supabase.co:5432/postgres
npx prisma db push --skip-generate
echo.
echo Concluido!
pause
