/* ==========================================================================
   SharkHub Dashboard — Common JavaScript
   Visible URI tab navigation without full page reload
   ========================================================================== */

'use strict'

const tabRoutes = {
    // Barber
    '/barber/dashboard': 'agenda',
    '/barber/dashboard/agenda': 'agenda',
    '/barber/dashboard/services': 'services',
    '/barber/dashboard/products': 'products',
    
    // Owner
    '/owner/dashboard': 'dashboard',
    '/owner/dashboard/dashboard': 'dashboard',
    '/owner/dashboard/barbershop-info': 'barbershop-info',
    '/owner/dashboard/manage-barbers': 'manage-barbers',
    '/owner/dashboard/global-agenda': 'global-agenda',
    
    // Customer
    '/customer/dashboard': 'my-appointments',
    '/customer/dashboard/my-appointments': 'my-appointments',
    '/customer/dashboard/book-appointment': 'book-appointment',
    '/customer/dashboard/profile': 'profile',
}

function switchTab(tabId, targetUrl = null) {
    document.querySelectorAll('.sidebar .nav-link').forEach(function (link) {
        link.classList.remove('active')
    })

    const activeLink = document.querySelector(`.sidebar .nav-link[data-tab="${tabId}"]`)

    if (activeLink) {
        activeLink.classList.add('active')
    }

    document.querySelectorAll('.content-section').forEach(function (section) {
        section.classList.remove('active')
    })

    const targetSection = document.getElementById(tabId)

    if (targetSection) {
        targetSection.classList.add('active')
    }

    if (targetUrl) {
        const nextUrl = new URL(targetUrl, window.location.origin)

        if (window.location.pathname !== nextUrl.pathname) {
            window.history.pushState({ tabId: tabId }, '', nextUrl.pathname)
        }
    }

    const sidebar = document.querySelector('.sidebar')

    if (sidebar && window.innerWidth <= 991) {
        sidebar.classList.remove('open')
    }
}

function getCurrentTab() {
    return tabRoutes[window.location.pathname] || null
}

function activateTabFromCurrentUrl() {
    const tabId = getCurrentTab()

    if (tabId) {
        switchTab(tabId)
    }
}

function configureDashboardLinks() {
    document.querySelectorAll('.sidebar .nav-link[data-tab]').forEach(function (link) {
        link.addEventListener('click', function (event) {
            event.preventDefault()

            const tabId = link.dataset.tab
            const targetUrl = link.getAttribute('href')

            switchTab(tabId, targetUrl)
        })
    })
}

function configureSidebarToggle() {
    const toggleBtn = document.querySelector('.sidebar-toggle')
    const sidebar = document.querySelector('.sidebar')

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', function () {
            sidebar.classList.toggle('open')
        })
    }
}

document.addEventListener('DOMContentLoaded', function () {
    configureSidebarToggle()
    configureDashboardLinks()
    activateTabFromCurrentUrl()
})

window.addEventListener('popstate', function () {
    activateTabFromCurrentUrl()
})

window.switchTab = switchTab