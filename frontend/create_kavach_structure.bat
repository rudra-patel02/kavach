@echo off

mkdir frontend
mkdir frontend\app
mkdir frontend\app\dashboard
mkdir frontend\app\machines
mkdir frontend\app\analytics
mkdir frontend\app\alerts
mkdir frontend\app\copilot
mkdir frontend\app\digital-twin
mkdir frontend\app\knowledge-graph
mkdir frontend\app\settings

mkdir frontend\components
mkdir frontend\components\layout
mkdir frontend\components\dashboard
mkdir frontend\components\charts
mkdir frontend\components\digitalTwin
mkdir frontend\components\ui

mkdir frontend\hooks
mkdir frontend\lib
mkdir frontend\styles
mkdir frontend\public
mkdir frontend\public\icons
mkdir frontend\types
mkdir frontend\utils

mkdir backend
mkdir backend\app
mkdir backend\app\api
mkdir backend\app\models
mkdir backend\app\services
mkdir backend\app\routes

@echo off
echo Creating Kavach folder structure...

mkdir components
mkdir components\layout
mkdir components\dashboard
mkdir components\ui
mkdir components\charts
mkdir components\digitalTwin

mkdir hooks
mkdir lib
mkdir styles
mkdir types
mkdir utils

type nul > components\layout\Sidebar.tsx
type nul > components\layout\Navbar.tsx
type nul > components\layout\DashboardLayout.tsx

type nul > styles\dashboard.css
type nul > styles\sidebar.css
type nul > styles\navbar.css

echo.
echo ==============================
echo Kavach folders created!
echo ==============================
pause