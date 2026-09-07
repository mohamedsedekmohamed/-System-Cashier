import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import DashboardLayout from './components/DashboardLayout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardHome from './pages/DashboardHome';
import AdminPage from './pages/admin/AdminPage';
import AuthPage from './pages/auth/AuthPage';
import BranchList from './pages/branches/BranchList';
import BranchAdd from './pages/branches/BranchAdd';
import BranchEdit from './pages/branches/BranchEdit';
import CategoryPage from './pages/category/CategoryPage';
import DiscountPage from './pages/discount/DiscountPage';
import FinancialAccountPage from './pages/financialAccount/FinancialAccountPage';
import HallPage from './pages/hall/HallPage';
import ProfilePage from './pages/profile/ProfilePage';
import AdminList from './pages/admins/AdminList';
import AdminAdd from './pages/admins/AdminAdd';
import AdminEdit from './pages/admins/AdminEdit';

// Cashiers
import CashierList from './pages/cashiers/CashierList';
import CashierAdd from './pages/cashiers/CashierAdd';
import CashierEdit from './pages/cashiers/CashierEdit';

// Cashier Men
import CashierManList from './pages/cashierMen/CashierManList';
import CashierManAdd from './pages/cashierMen/CashierManAdd';
import CashierManEdit from './pages/cashierMen/CashierManEdit';

// Deliveries
import DeliveryList from './pages/deliveries/DeliveryList';
import DeliveryAdd from './pages/deliveries/DeliveryAdd';
import DeliveryEdit from './pages/deliveries/DeliveryEdit';

// Expense Lists
import ExpenseListList from './pages/expenseLists/ExpenseListList';
import ExpenseListAdd from './pages/expenseLists/ExpenseListAdd';
import ExpenseListEdit from './pages/expenseLists/ExpenseListEdit';

// Hall Tables
import HallTableList from './pages/hallTables/HallTableList';
import HallTableAdd from './pages/hallTables/HallTableAdd';
import HallTableEdit from './pages/hallTables/HallTableEdit';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected */}
              <Route element={<PrivateRoute />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/dashboard" element={<DashboardHome />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/auth" element={<AuthPage />} />

                  {/* Branches — full CRUD */}
                  <Route path="/branches" element={<BranchList />} />
                  <Route path="/branches/add" element={<BranchAdd />} />
                  <Route path="/branches/edit/:id" element={<BranchEdit />} />

                  {/* Admins — full CRUD */}
                  <Route path="/admins" element={<AdminList />} />
                  <Route path="/admins/add" element={<AdminAdd />} />
                  <Route path="/admins/edit/:id" element={<AdminEdit />} />

                  {/* Cashiers — full CRUD */}
                  <Route path="/cashiers" element={<CashierList />} />
                  <Route path="/cashiers/add" element={<CashierAdd />} />
                  <Route path="/cashiers/edit/:id" element={<CashierEdit />} />
                  <Route path="/cashier" element={<Navigate to="/cashiers" replace />} /> {/* Legacy fallback */}

                  {/* Cashier Men — full CRUD */}
                  <Route path="/cashier-men" element={<CashierManList />} />
                  <Route path="/cashier-men/add" element={<CashierManAdd />} />
                  <Route path="/cashier-men/edit/:id" element={<CashierManEdit />} />
                  <Route path="/cashier-employees" element={<Navigate to="/cashier-men" replace />} /> {/* Legacy fallback */}

                  {/* Deliveries — full CRUD */}
                  <Route path="/deliveries" element={<DeliveryList />} />
                  <Route path="/deliveries/add" element={<DeliveryAdd />} />
                  <Route path="/deliveries/edit/:id" element={<DeliveryEdit />} />
                  <Route path="/delivery" element={<Navigate to="/deliveries" replace />} /> {/* Legacy fallback */}

                  {/* Expense Lists — full CRUD */}
                  <Route path="/expense-lists" element={<ExpenseListList />} />
                  <Route path="/expense-lists/add" element={<ExpenseListAdd />} />
                  <Route path="/expense-lists/edit/:id" element={<ExpenseListEdit />} />
                  <Route path="/expenses" element={<Navigate to="/expense-lists" replace />} /> {/* Legacy fallback */}

                  {/* Hall Tables — full CRUD */}
                  <Route path="/hall-tables" element={<HallTableList />} />
                  <Route path="/hall-tables/add" element={<HallTableAdd />} />
                  <Route path="/hall-tables/edit/:id" element={<HallTableEdit />} />

                  <Route path="/categories" element={<CategoryPage />} />
                  <Route path="/discounts" element={<DiscountPage />} />
                  <Route path="/financial" element={<FinancialAccountPage />} />
                  <Route path="/halls" element={<HallPage />} />
                </Route>
              </Route>

              {/* Fallbacks */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
