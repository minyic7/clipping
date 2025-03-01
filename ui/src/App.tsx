import './App.less';
import {Outlet} from "react-router-dom";
import AppHeader from "@/components/layout/header/AppHeader.tsx";


function App() {

    return (
        <>
            {/* Top Ribbon */}
            <AppHeader />

            {/*Main Content Area */}
            <main className="content-container">
                <Outlet/>
            </main>
        </>
    );
}

export default App;