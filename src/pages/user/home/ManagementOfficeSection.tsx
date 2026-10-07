import {EditorialCta, EditorialImage, Reveal} from './editorial';
import {homepageImages} from './homepageImages';

export function ManagementOfficeSection() {
  return (
    <section className="border-b border-[#E8E1D7] bg-[#FCFAF7]">
      <div className="mx-auto grid w-full max-w-[1500px] items-stretch gap-0 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="flex min-w-0 flex-col justify-center px-6 pb-14 pt-10 sm:px-10 lg:px-16 lg:py-24">
          <Reveal>
            <h2 className="break-words font-display text-[26px] font-medium leading-[1.1] text-[#1E1E1E] sm:text-[32px] lg:text-[36px] xl:text-[40px]">
              <span className="block">THE</span>
              <span className="block">MANAGEMENT</span>
              <span className="block">OFFICE.</span>
            </h2>

            <p className="mt-5 max-w-[26rem] break-words font-display text-[19px] italic leading-[1.5] text-[#1E1E1E] lg:text-[23px]">
              Every request begins with a conversation.
            </p>

            <p className="mt-4 max-w-[28rem] text-sm leading-[1.85] text-[#77716A]">
              Management is the private point of contact for personal requests, experiences and
              professional enquiries.
            </p>

            <div className="mt-6">
              <EditorialCta to="/dashboard/messages">Meet the management</EditorialCta>
            </div>
          </Reveal>
        </div>

        <div className="relative mx-6 h-[78vw] max-h-[440px] overflow-hidden border border-[#E8E1D7] sm:mx-10 sm:max-h-[500px] lg:mx-0 lg:h-auto lg:max-h-none lg:min-h-[76vh] lg:border-0">
          <EditorialImage
            src={homepageImages.session2}
            alt="Gillian Anderson reviewing papers at her desk in a calm interior"
            position="object-[center_32%]"
          />
        </div>
      </div>
    </section>
  );
}
