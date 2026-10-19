import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const SplashScreen = lazy(() => import('@/features/splash/SplashScreen'));
const ProfilesScreen = lazy(() => import('@/features/profiles/ProfilesScreen'));
const OnboardingScreen = lazy(() => import('@/features/onboarding/OnboardingScreen'));
const LobbyScreen = lazy(() => import('@/features/home/LobbyScreen'));
const WorldsScreen = lazy(() => import('@/features/worlds/WorldsScreen'));
const MapScreen = lazy(() => import('@/features/map/MapScreen'));
const GameShellScreen = lazy(() => import('@/features/games/shell/GameShellScreen'));
const RewardsScreen = lazy(() => import('@/features/rewards/RewardsScreen'));
const ShopScreen = lazy(() => import('@/features/shop/ShopScreen'));
const CharacterScreen = lazy(() => import('@/features/profile/CharacterScreen'));
const SettingsModal = lazy(() => import('@/features/settings/SettingsModal'));
const ParentsGateScreen = lazy(() => import('@/features/parents/ParentsGateScreen'));
const ParentsDashboardScreen = lazy(() => import('@/features/parents/ParentsDashboardScreen'));
const DevUiScreen = lazy(() => import('@/features/dev/DevUiScreen'));
const DevArtScreen = lazy(() => import('@/features/dev/DevArtScreen'));
const NotFoundScreen = lazy(() => import('@/features/errors/NotFoundScreen'));

const FallbackLoader = () => (
  <div className="min-h-screen bg-sky-top flex items-center justify-center">
    <div className="w-12 h-12 rounded-full border-4 border-white border-t-amber-400 animate-spin" />
  </div>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<FallbackLoader />}>
        <SplashScreen />
      </Suspense>
    ),
  },
  {
    path: '/profiles',
    element: (
      <Suspense fallback={<FallbackLoader />}>
        <ProfilesScreen />
      </Suspense>
    ),
  },
  {
    path: '/onboarding',
    element: (
      <Suspense fallback={<FallbackLoader />}>
        <OnboardingScreen />
      </Suspense>
    ),
  },
  {
    path: '/home',
    element: (
      <Suspense fallback={<FallbackLoader />}>
        <LobbyScreen />
      </Suspense>
    ),
  },
  {
    path: '/worlds',
    element: (
      <Suspense fallback={<FallbackLoader />}>
        <WorldsScreen />
      </Suspense>
    ),
  },
  {
    path: '/map/:subjectId',
    element: (
      <Suspense fallback={<FallbackLoader />}>
        <MapScreen />
      </Suspense>
    ),
  },
  {
    path: '/play/:lessonId',
    element: (
      <Suspense fallback={<FallbackLoader />}>
        <GameShellScreen />
      </Suspense>
    ),
  },
  {
    path: '/rewards',
    element: (
      <Suspense fallback={<FallbackLoader />}>
        <RewardsScreen />
      </Suspense>
    ),
  },
  {
    path: '/shop',
    element: (
      <Suspense fallback={<FallbackLoader />}>
        <ShopScreen />
      </Suspense>
    ),
  },
  {
    path: '/me',
    element: (
      <Suspense fallback={<FallbackLoader />}>
        <CharacterScreen />
      </Suspense>
    ),
  },
  {
    path: '/settings',
    element: (
      <Suspense fallback={<FallbackLoader />}>
        <SettingsModal />
      </Suspense>
    ),
  },
  {
    path: '/parents/gate',
    element: (
      <Suspense fallback={<FallbackLoader />}>
        <ParentsGateScreen />
      </Suspense>
    ),
  },
  {
    path: '/parents',
    element: (
      <Suspense fallback={<FallbackLoader />}>
        <ParentsDashboardScreen />
      </Suspense>
    ),
  },
  {
    path: '/dev/ui',
    element: (
      <Suspense fallback={<FallbackLoader />}>
        <DevUiScreen />
      </Suspense>
    ),
  },
  {
    path: '/dev/art',
    element: (
      <Suspense fallback={<FallbackLoader />}>
        <DevArtScreen />
      </Suspense>
    ),
  },
  {
    path: '*',
    element: (
      <Suspense fallback={<FallbackLoader />}>
        <NotFoundScreen />
      </Suspense>
    ),
  },
]);

export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};
