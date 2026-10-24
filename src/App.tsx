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

// Financial Accounts
import FinancialAccountList from './pages/financialAccounts/FinancialAccountList';
import FinancialAccountAdd from './pages/financialAccounts/FinancialAccountAdd';
import FinancialAccountEdit from './pages/financialAccounts/FinancialAccountEdit';

// Halls
import HallList from './pages/halls/HallList';
import HallAdd from './pages/halls/HallAdd';
import HallEdit from './pages/halls/HallEdit';

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

// Manufacturing (أوامر وتشغيل الإنتاج الفعلي في الفروع)
import ManufacturingList from './pages/manufacturing/ManufacturingList';
import ManufacturingAdd from './pages/manufacturing/ManufacturingAdd';
import ManufacturingEdit from './pages/manufacturing/ManufacturingEdit';

// Product Manufacturing (معايير وتراكيب تصنيع المنتجات - BOM)
import ProductManufacturingList from './pages/productManufacturings/ProductManufacturingList';
import ProductManufacturingAdd from './pages/productManufacturings/ProductManufacturingAdd';
import ProductManufacturingEdit from './pages/productManufacturings/ProductManufacturingEdit';

// Materials
import MaterialList from './pages/materials/MaterialList';
import MaterialAdd from './pages/materials/MaterialAdd';
import MaterialEdit from './pages/materials/MaterialEdit';

// Payment Methods
import PaymentMethodList from './pages/paymentMethods/PaymentMethodList';
import PaymentMethodAdd from './pages/paymentMethods/PaymentMethodAdd';
import PaymentMethodEdit from './pages/paymentMethods/PaymentMethodEdit';

// Categories
import CategoryList from './pages/categories/CategoryList';
import CategoryAdd from './pages/categories/CategoryAdd';
import CategoryEdit from './pages/categories/CategoryEdit';

// Products
import ProductList from './pages/products/ProductList';
import ProductAdd from './pages/products/ProductAdd';
import ProductEdit from './pages/products/ProductEdit';

// Addons
import AddonList from './pages/addons/AddonList';
import AddonAdd from './pages/addons/AddonAdd';
import AddonEdit from './pages/addons/AddonEdit';

// Product Recipes
import ProductRecipeList from './pages/productRecipes/ProductRecipeList';
import ProductRecipeAdd from './pages/productRecipes/ProductRecipeAdd';
import ProductRecipeEdit from './pages/productRecipes/ProductRecipeEdit';

// Suppliers
import SupplierList from './pages/suppliers/SupplierList';
import SupplierAdd from './pages/suppliers/SupplierAdd';
import SupplierEdit from './pages/suppliers/SupplierEdit';

// Discounts
import DiscountList from './pages/discounts/DiscountList';
import DiscountAdd from './pages/discounts/DiscountAdd';
import DiscountEdit from './pages/discounts/DiscountEdit';

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

// Sales
import SaleList from './pages/sales/SaleList';
import SaleAdd from './pages/sales/SaleAdd';

// Dues & Installments
import DuesManagementPage from './pages/dues/DuesManagementPage';

// Salers
import SalerList from './pages/salers/SalerList';
import SalerAdd from './pages/salers/SalerAdd';
import SalerEdit from './pages/salers/SalerEdit';

// Material Inventory
import MaterialInventoryList from './pages/materialInventory/MaterialInventoryList';
import MaterialInventoryDetail from './pages/materialInventory/MaterialInventoryDetail';

// Recipe Inventory
import RecipeInventoryList from './pages/recipeInventory/RecipeInventoryList';
import RecipeInventoryDetail from './pages/recipeInventory/RecipeInventoryDetail';

// Reports
import StartShiftReportPage from './pages/reports/StartShiftReportPage';

// Settings / Business Setup
import BusinessSetupPage from './pages/settings/BusinessSetupPage';

// Banners
import BannerList from './pages/banners/BannerList';

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

                  {/* Financial Accounts — full CRUD */}
                  <Route path="financial-accounts" element={<FinancialAccountList />} />
                  <Route path="financial-accounts/add" element={<FinancialAccountAdd />} />
                  <Route path="financial-accounts/edit/:id" element={<FinancialAccountEdit />} />
                  <Route path="financial" element={<Navigate to="/dashboard/financial-accounts" replace />} /> {/* Legacy fallback */}

                  {/* Halls — full CRUD */}
                  <Route path="halls" element={<HallList />} />
                  <Route path="halls/add" element={<HallAdd />} />
                  <Route path="halls/edit/:id" element={<HallEdit />} />

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

                  {/* Manufacturing — أوامر وتشغيل التصنيع الفعلي */}
                  <Route path="manufacturing" element={<ManufacturingList />} />
                  <Route path="manufacturing/add" element={<ManufacturingAdd />} />
                  <Route path="manufacturing/edit/:id" element={<ManufacturingEdit />} />

                  {/* Product Manufacturing — معايير وتراكيب تصنيع المنتجات (BOM) */}
                  <Route path="product-manufacturings" element={<ProductManufacturingList />} />
                  <Route path="product-manufacturings/add" element={<ProductManufacturingAdd />} />
                  <Route path="product-manufacturings/edit/:id" element={<ProductManufacturingEdit />} />

                  {/* Materials — full CRUD */}
                  <Route path="materials" element={<MaterialList />} />
                  <Route path="materials/add" element={<MaterialAdd />} />
                  <Route path="materials/edit/:id" element={<MaterialEdit />} />

                  {/* Material Inventory — جرد المواد الخام */}
                  <Route path="material-inventory" element={<MaterialInventoryList />} />
                  <Route path="material-inventory/:id" element={<MaterialInventoryDetail />} />
                  <Route path="inventory/materials" element={<Navigate to="/dashboard/material-inventory" replace />} />

                  {/* Recipe Inventory — جرد وصفات التصنيع */}
                  <Route path="recipe-inventory" element={<RecipeInventoryList />} />
                  <Route path="recipe-inventory/:id" element={<RecipeInventoryDetail />} />
                  <Route path="inventory/recipes" element={<Navigate to="/dashboard/recipe-inventory" replace />} />

                  {/* Payment Methods — full CRUD */}
                  <Route path="payment-methods" element={<PaymentMethodList />} />
                  <Route path="payment-methods/add" element={<PaymentMethodAdd />} />
                  <Route path="payment-methods/edit/:id" element={<PaymentMethodEdit />} />

                  {/* Categories — full CRUD */}
                  <Route path="categories" element={<CategoryList />} />
                  <Route path="categories/add" element={<CategoryAdd />} />
                  <Route path="categories/edit/:id" element={<CategoryEdit />} />

                  {/* Products — full CRUD */}
                  <Route path="products" element={<ProductList />} />
                  <Route path="products/add" element={<ProductAdd />} />
                  <Route path="products/edit/:id" element={<ProductEdit />} />

                  {/* Addons — full CRUD */}
                  <Route path="addons" element={<AddonList />} />
                  <Route path="addons/add" element={<AddonAdd />} />
                  <Route path="addons/edit/:id" element={<AddonEdit />} />

                  {/* Product Recipes — full CRUD */}
                  <Route path="product-recipes" element={<ProductRecipeList />} />
                  <Route path="product-recipes/add" element={<ProductRecipeAdd />} />
                  <Route path="product-recipes/edit/:id" element={<ProductRecipeEdit />} />

                  {/* Purchases */}
                  <Route path="purchases" element={<PurchaseList />} />
                  <Route path="purchases/add" element={<PurchaseAdd />} />

                  {/* Sales */}
                  <Route path="sales" element={<SaleList />} />
                  <Route path="sales/add" element={<SaleAdd />} />

                  {/* Dues & Installments */}
                  <Route path="dues" element={<DuesManagementPage />} />
                  <Route path="installments" element={<Navigate to="/dashboard/dues" replace />} />

                  {/* Suppliers — full CRUD */}
                  <Route path="suppliers" element={<SupplierList />} />
                  <Route path="suppliers/add" element={<SupplierAdd />} />
                  <Route path="suppliers/edit/:id" element={<SupplierEdit />} />

                  {/* Salers — full CRUD */}
                  <Route path="salers" element={<SalerList />} />
                  <Route path="salers/add" element={<SalerAdd />} />
                  <Route path="salers/edit/:id" element={<SalerEdit />} />

                  {/* Discounts — full CRUD */}
                  <Route path="discounts" element={<DiscountList />} />
                  <Route path="discounts/add" element={<DiscountAdd />} />
                  <Route path="discounts/edit/:id" element={<DiscountEdit />} />

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

                  {/* Banners */}
                  <Route path="banners" element={<BannerList />} />

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
