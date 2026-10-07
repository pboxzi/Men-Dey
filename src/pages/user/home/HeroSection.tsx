import {EditorialCta, EditorialImage, Reveal} from './editorial';
import {homepageImages} from './homepageImages';

export function HeroSection() {
  return (
    <section className="border-b border-[#E8E1D7] bg-[#FCFAF7]">
      <div className="mx-auto grid w-full max-w-[1500px] items-stretch gap-0 lg:grid-cols-[1.05fr_1fr]">
        <div className="relative h-[92vw] max-h-[480px] w-full overflow-hidden sm:max-h-[540px] lg:h-auto lg:max-h-none lg:min-h-[80vh]">
          <EditorialImage
            src={homepageImages.session1}
            alt="Portrait of Gillian Anderson at her desk"
            position="object-[center_24%]"
            eager
          />
        </div>

        <div className="flex min-w-0 flex-col justify-center px-6 py-12 sm:px-10 lg:px-16 lg:py-24">
          <Reveal>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#77716A] sm:text-[11px]">
              Welcome to your private space.
            </p>

            <h1 className="mt-5 break-words font-display text-[30px] font-medium leading-[1.1] text-[#1E1E1E] sm:text-[38px] lg:text-[42px] xl:text-[48px]">
              <span className="block">WELCOME TO</span>
              <span className="block">GILLIAN ANDERSON</span>
              <span className="block">MANAGEMENT.</span>
            </h1>

            <p className="mt-5 max-w-[28rem] text-sm leading-[1.85] text-[#77716A]">
              A private space for personal requests, carefully considered experiences, and direct
              communication with management.
            </p>

            <div className="mt-6">
              <EditorialCta to="/dashboard/messages">Begin a conversation</EditorialCta>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
