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

import ShiftList from './pages/shifts/ShiftList';
import ShiftAdd from './pages/shifts/ShiftAdd';
import ShiftEdit from './pages/shifts/ShiftEdit';

import BranchList from './pages/branches/BranchList';
import BranchAdd from './pages/branches/BranchAdd';
import BranchEdit from './pages/branches/BranchEdit';
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

// Kitchens
import KitchenList from './pages/kitchens/KitchenList';
import KitchenAdd from './pages/kitchens/KitchenAdd';
import KitchenEdit from './pages/kitchens/KitchenEdit';

// Orders
import OrderList from './pages/orders/OrderList';
import OrderAdd from './pages/orders/OrderAdd';
import OrderEdit from './pages/orders/OrderEdit';

// Manufacturing
import ManufacturingList from './pages/manufacturing/ManufacturingList';
import ManufacturingAdd from './pages/manufacturing/ManufacturingAdd';
import ManufacturingEdit from './pages/manufacturing/ManufacturingEdit';

// Materials
import MaterialList from './pages/materials/MaterialList';
import MaterialAdd from './pages/materials/MaterialAdd';
import MaterialEdit from './pages/materials/MaterialEdit';

// Payment Methods
import PaymentMethodList from './pages/paymentMethods/PaymentMethodList';
import PaymentMethodAdd from './pages/paymentMethods/PaymentMethodAdd';
import PaymentMethodEdit from './pages/paymentMethods/PaymentMethodEdit';

// Products
import ProductList from './pages/products/ProductList';
import ProductAdd from './pages/products/ProductAdd';
import ProductEdit from './pages/products/ProductEdit';

// Product Recipes
import ProductRecipeList from './pages/productRecipes/ProductRecipeList';
import ProductRecipeAdd from './pages/productRecipes/ProductRecipeAdd';
import ProductRecipeEdit from './pages/productRecipes/ProductRecipeEdit';

// Suppliers
import SupplierList from './pages/suppliers/SupplierList';
import SupplierAdd from './pages/suppliers/SupplierAdd';
import SupplierEdit from './pages/suppliers/SupplierEdit';

// Taxes
import TaxList from './pages/taxes/TaxList';
import TaxAdd from './pages/taxes/TaxAdd';
import TaxEdit from './pages/taxes/TaxEdit';

// Wastes
import WasteList from './pages/wastes/WasteList';
import WasteAdd from './pages/wastes/WasteAdd';
import WasteEdit from './pages/wastes/WasteEdit';

// Purchases
import PurchaseList from './pages/purchases/PurchaseList';
import PurchaseAdd from './pages/purchases/PurchaseAdd';

// Material Inventory
import MaterialInventoryList from './pages/materialInventory/MaterialInventoryList';
import MaterialInventoryDetail from './pages/materialInventory/MaterialInventoryDetail';

// Reports
import StartShiftReportPage from './pages/reports/StartShiftReportPage';

// Settings / Business Setup
import BusinessSetupPage from './pages/settings/BusinessSetupPage';

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
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<DashboardHome />} />
                  <Route path="profile" element={<ProfilePage />} />

                  {/* Branches — full CRUD */}
                  <Route path="branches" element={<BranchList />} />
                  <Route path="branches/add" element={<BranchAdd />} />
                  <Route path="branches/edit/:id" element={<BranchEdit />} />

                  {/* Admins — full CRUD */}
                  <Route path="admins" element={<AdminList />} />
                  <Route path="admins/add" element={<AdminAdd />} />
                  <Route path="admins/edit/:id" element={<AdminEdit />} />

                  {/* Cashiers — full CRUD */}
                  <Route path="cashiers" element={<CashierList />} />
                  <Route path="cashiers/add" element={<CashierAdd />} />
                  <Route path="cashiers/edit/:id" element={<CashierEdit />} />
                  <Route path="cashier" element={<Navigate to="/dashboard/cashiers" replace />} /> {/* Legacy fallback */}

                  {/* Cashier Men — full CRUD */}
                  <Route path="cashier-men" element={<CashierManList />} />
                  <Route path="cashier-men/add" element={<CashierManAdd />} />
                  <Route path="cashier-men/edit/:id" element={<CashierManEdit />} />
                  <Route path="cashier-employees" element={<Navigate to="/dashboard/cashier-men" replace />} /> {/* Legacy fallback */}

                  {/* Deliveries — full CRUD */}
                  <Route path="deliveries" element={<DeliveryList />} />
                  <Route path="deliveries/add" element={<DeliveryAdd />} />
                  <Route path="deliveries/edit/:id" element={<DeliveryEdit />} />
                  <Route path="delivery" element={<Navigate to="/dashboard/deliveries" replace />} /> {/* Legacy fallback */}

                  {/* Expense Lists — full CRUD */}
                  <Route path="expense-lists" element={<ExpenseListList />} />
                  <Route path="expense-lists/add" element={<ExpenseListAdd />} />
                  <Route path="expense-lists/edit/:id" element={<ExpenseListEdit />} />
                  <Route path="expenses" element={<Navigate to="/dashboard/expense-lists" replace />} /> {/* Legacy fallback */}

                  {/* Hall Tables — full CRUD */}
                  <Route path="hall-tables" element={<HallTableList />} />
                  <Route path="hall-tables/add" element={<HallTableAdd />} />
                  <Route path="hall-tables/edit/:id" element={<HallTableEdit />} />

                  {/* Kitchens — full CRUD */}
                  <Route path="kitchens" element={<KitchenList />} />
                  <Route path="kitchens/add" element={<KitchenAdd />} />
                  <Route path="kitchens/edit/:id" element={<KitchenEdit />} />

                  {/* Orders */}
                  <Route path="orders" element={<OrderList />} />
                  <Route path="orders/add" element={<OrderAdd />} />
                  <Route path="orders/edit/:id" element={<OrderEdit />} />

                  {/* Manufacturing */}
                  <Route path="manufacturing" element={<ManufacturingList />} />
                  <Route path="manufacturing/add" element={<ManufacturingAdd />} />
                  <Route path="manufacturing/edit/:id" element={<ManufacturingEdit />} />

                  {/* Materials — full CRUD */}
                  <Route path="materials" element={<MaterialList />} />
                  <Route path="materials/add" element={<MaterialAdd />} />
                  <Route path="materials/edit/:id" element={<MaterialEdit />} />

                  {/* Material Inventory — جرد المواد الخام */}
                  <Route path="material-inventory" element={<MaterialInventoryList />} />
                  <Route path="material-inventory/:id" element={<MaterialInventoryDetail />} />
                  <Route path="inventory/materials" element={<Navigate to="/dashboard/material-inventory" replace />} />

                  {/* Payment Methods — full CRUD */}
                  <Route path="payment-methods" element={<PaymentMethodList />} />
                  <Route path="payment-methods/add" element={<PaymentMethodAdd />} />
                  <Route path="payment-methods/edit/:id" element={<PaymentMethodEdit />} />

                  {/* Products — full CRUD */}
                  <Route path="products" element={<ProductList />} />
                  <Route path="products/add" element={<ProductAdd />} />
                  <Route path="products/edit/:id" element={<ProductEdit />} />

                  {/* Product Recipes — full CRUD */}
                  <Route path="product-recipes" element={<ProductRecipeList />} />
                  <Route path="product-recipes/add" element={<ProductRecipeAdd />} />
                  <Route path="product-recipes/edit/:id" element={<ProductRecipeEdit />} />

                  {/* Purchases */}
                  <Route path="purchases" element={<PurchaseList />} />
                  <Route path="purchases/add" element={<PurchaseAdd />} />

                  {/* Suppliers — full CRUD */}
                  <Route path="suppliers" element={<SupplierList />} />
                  <Route path="suppliers/add" element={<SupplierAdd />} />
                  <Route path="suppliers/edit/:id" element={<SupplierEdit />} />

                  {/* Taxes — full CRUD */}
                  <Route path="taxes" element={<TaxList />} />
                  <Route path="taxes/add" element={<TaxAdd />} />
                  <Route path="taxes/edit/:id" element={<TaxEdit />} />

                  {/* Wastes — full CRUD */}
                  <Route path="wastes" element={<WasteList />} />
                  <Route path="wastes/add" element={<WasteAdd />} />
                  <Route path="wastes/edit/:id" element={<WasteEdit />} />

                  {/* Shifts — full CRUD */}
                  <Route path="shifts" element={<ShiftList />} />
                  <Route path="shifts/add" element={<ShiftAdd />} />
                  <Route path="shifts/edit/:id" element={<ShiftEdit />} />

                  {/* Reports */}
                  <Route path="reports/start-shifts" element={<StartShiftReportPage />} />

                  {/* Settings / Business Setup */}
                  <Route path="settings" element={<BusinessSetupPage />} />
                  <Route path="business-setup" element={<Navigate to="/dashboard/settings" replace />} />
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
