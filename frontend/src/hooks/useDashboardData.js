import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";

export const useDashboardData = () => {
    const [data, setData] = useState({
        stats: null,
        charts: {
            monthly: [],
            categories: [],
            balance: [],
            incomeSources: [],
            recent: []
        },
        loading: {
            stats: true,
            charts: true
        },
        error: null
    });

    const fetchStats = useCallback(async () => {
        try {
        const res = await api.get("/finance/transactions/stats/");

        if (res.ok) {
            const stats = await res.json();

            setData(prev => ({
                ...prev,
                stats,
                loading: { ...prev.loading, stats: false }
            }));
        }
        } catch (error) {
            setData(prev => ({
                ...prev,
                error: error.message,
                loading: { ...prev.loading, stats: false }
            }));
        }
    }, []);

    const fetchChartsData = useCallback(async () => {
        try {
            const endpoints = [
                "/finance/transactions/monthly/?months=6",
                "/finance/transactions/expenses-by-category/",
                "/finance/transactions/balance-series/?months=6",
                "/finance/transactions/income-by-source/",
                "/finance/transactions/recent/?limit=10"
            ];

            const responses = await Promise.allSettled(
                endpoints.map(
                    endpoint => api.get(endpoint).then(res => res.ok ? res.json() : null)
                )
            );

            const [monthlyRes, categoriesRes, balanceRes, incomeRes, recentRes] = responses;

            const charts = {
                monthly: monthlyRes.status === 'fulfilled' && monthlyRes.value?.months
                    ? monthlyRes.value.months
                    : [],
                categories: categoriesRes.status === 'fulfilled' && categoriesRes.value?.items
                    ? categoriesRes.value.items
                    : [],
                balance: balanceRes.status === 'fulfilled' && balanceRes.value?.months
                    ? balanceRes.value.months
                    : [],
                incomeSources: incomeRes.status === 'fulfilled' && incomeRes.value?.items
                    ? incomeRes.value.items
                    : [],
                recent: recentRes.status === 'fulfilled' && recentRes.value
                    ? recentRes.value
                    : []
            };

            setData(prev => ({
                ...prev,
                charts,
                loading: { ...prev.loading, charts: false }
            }));
        } catch (error) {
            setData(prev => ({
                ...prev,
                error: error.message,
                loading: { ...prev.loading, charts: false }
            }));
        }
    }, []);

    const refetch = useCallback(() => {
        setData(prev => ({
            ...prev,
            loading: { stats: true, charts: true },
            error: null
        }));

        fetchStats();
        fetchChartsData();
    }, [fetchStats, fetchChartsData]);

    useEffect(() => {
        fetchStats();
        fetchChartsData();
    }, [fetchStats, fetchChartsData]);

    return { ...data, refetch };
};