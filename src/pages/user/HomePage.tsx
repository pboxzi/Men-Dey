import {Navigate} from 'react-router-dom';

import {useAuth} from '../../auth/AuthContext';
import {Spinner} from '../../components/ui/Spinner';
import {ClosingSection} from './home/ClosingSection';
import {HomeFooter} from './home/HomeFooter';
import {HeroSection} from './home/HeroSection';
import {JourneySection} from './home/JourneySection';
import {ManagementOfficeSection} from './home/ManagementOfficeSection';
import {MembershipSection} from './home/MembershipSection';
import {PrivateExperiencesSection} from './home/PrivateExperiencesSection';

export function HomePage() {
  const {loading, profileLoading, role} = useAuth();

  if (loading || profileLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (role === 'management' || role === 'admin') return <Navigate to="/management" replace />;

  return (
    <div className="w-full bg-[#FCFAF7] text-[#1E1E1E]">
      <HeroSection />
      <ManagementOfficeSection />
      <PrivateExperiencesSection />
      <JourneySection />
      <MembershipSection />
      <ClosingSection />
      <HomeFooter />
    </div>
  );
}
