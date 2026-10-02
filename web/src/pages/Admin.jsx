import { Navigate } from "react-router-dom";

export { default as AdminUsers } from "./AdminUsers.jsx";
export { default as AdminStickers } from "./AdminStickers.jsx";

export default function Admin() {
  return <Navigate to="/admin/users" replace />;
}
