import  {Route,BrowserRouter,Routes} from 'react-router-dom'
import React from 'react'
import Login from '../screens/Login'
import Register from '../screens/Register'
import Home from '../screens/Home'
import Project from '../screens/Project'
import LoadingAnimation from '../screens/LoadingAnimation'
import UserAuth from "../auth/UserAuth"
function AppRoutes() {
 

  return (
   <BrowserRouter>
    <Routes>
        <Route
        path='/'element={<LoadingAnimation/>}
        />
        <Route
        path='/home'element=
        {<UserAuth><Home/></UserAuth>}
        
        />
        <Route
        path='/login'element={<Login/>}
        />
        <Route
        path='/register'element={<Register/>}
        />
        <Route
        path='/project/:projectId'element={<UserAuth><Project/></UserAuth>}
        />
            </Routes>
   </BrowserRouter>
  )
}

export default AppRoutes
