import { useCallback, useMemo, useState } from "react";
import type { AdminTabKey } from "@/src/components/admin/AdminTabs";
import {
  ADMIN_PAGE_SIZES,
  useAdminCategories,
  useAdminOrders,
  useAdminProducts,
  useAdminStats,
} from "@/src/lib/hooks/useAdminData";
import { useAdminCatalogueController } from "@/src/lib/hooks/useAdminCatalogueController";
import { useAdminCategoriesController } from "@/src/lib/hooks/useAdminCategoriesController";
import { useAdminHeaderActions } from "@/src/lib/hooks/useAdminHeaderActions";
import { useAdminOrdersController } from "@/src/lib/hooks/useAdminOrdersController";
import { useAdminSession } from "@/src/lib/hooks/useAdminSession";

const PRODUCTS_PER_PAGE = ADMIN_PAGE_SIZES.products;
const ITEMS_PER_PAGE = ADMIN_PAGE_SIZES.orders;

export function useAdminPageState() {
  const { authenticated, authLoading, ready } = useAdminSession();

  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [productPage, setProductPage] = useState(1);
  const [activeTab, setActiveTab] = useState<AdminTabKey>("orders");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const isCatalogueTab = activeTab === "catalogue";

  // Admin needs the full category list (including inactive) for management + product form.
  const categoriesQuery = useAdminCategories(authenticated, true);

  const statsQuery = useAdminStats(authenticated);
  const ordersQuery = useAdminOrders(
    { page: currentPage, limit: ITEMS_PER_PAGE, status: statusFilter },
    authenticated,
  );
  const productsQuery = useAdminProducts(
    { page: productPage, limit: PRODUCTS_PER_PAGE, isActive: "all" },
    authenticated && isCatalogueTab,
  );

  const orders = useMemo(() => ordersQuery.data?.orders ?? [], [ordersQuery.data?.orders]);
  const totalPages = ordersQuery.data?.totalPages ?? 1;
  const products = useMemo(() => productsQuery.data?.products ?? [], [productsQuery.data?.products]);
  const productTotalPages = productsQuery.data?.totalPages ?? 1;
  const stats = statsQuery.data?.stats ?? null;
  const chartData = statsQuery.data?.chartData ?? [];
  const productSales = statsQuery.data?.productSalesData ?? [];
  const selectedOrder = useMemo(
    () => (selectedOrderId ? orders.find((o) => o.id === selectedOrderId) ?? null : null),
    [orders, selectedOrderId],
  );

  const clearSelectedOrder = useCallback(() => setSelectedOrderId(null), []);
  const handleProductSaved = useCallback(
    (wasCreate: boolean) => {
      // On edit, keep the user on their current page; only jump to page 1 for new products.
      if (wasCreate) setProductPage(1);
    },
    [],
  );

  const ordersController = useAdminOrdersController(orders, clearSelectedOrder);
  const catalogueController = useAdminCatalogueController({ onAfterSave: handleProductSaved });
  const categoriesController = useAdminCategoriesController();
  const headerActions = useAdminHeaderActions();

  const handleStatusFilterChange = useCallback((key: string) => {
    setStatusFilter(key);
    setCurrentPage(1);
  }, []);

  return {
    authenticated,
    authLoading,
    ready,
    statusFilter,
    currentPage,
    productPage,
    activeTab,
    selectedOrderId,
    statsQuery,
    ordersQuery,
    productsQuery,
    categoriesQuery,
    orders,
    totalPages,
    products,
    productTotalPages,
    stats,
    chartData,
    productSales,
    selectedOrder,
    ordersController,
    catalogueController,
    categoriesController,
    headerActions,
    setActiveTab,
    setCurrentPage,
    setProductPage,
    setSelectedOrderId,
    clearSelectedOrder,
    handleStatusFilterChange,
  };
}
