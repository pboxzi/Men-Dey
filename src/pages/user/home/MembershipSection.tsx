import {EditorialCta, EditorialImage, Reveal} from './editorial';
import {homepageImages} from './homepageImages';

const MEMBERSHIP_STEPS = [
  {title: 'Create your account', copy: 'Submit your information and request.'},
  {title: 'Speak with management', copy: 'Management communicates with you directly.'},
  {
    title: 'Discuss your request',
    copy: 'Your desired experience or arrangement is considered.',
  },
  {
    title: 'Receive your requirements',
    copy: 'Management provides the appropriate membership requirements.',
  },
  {title: 'Complete membership', copy: 'Complete the required membership process.'},
  {title: 'Access', copy: 'Your private management experience becomes available.'},
];

export function MembershipSection() {
  return (
    <section className="border-b border-black/20 bg-[#1E1E1E]">
      <div className="mx-auto grid w-full max-w-[1500px] items-stretch gap-0 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative h-[72vw] max-h-[460px] w-full overflow-hidden sm:max-h-[520px] lg:h-auto lg:max-h-none lg:min-h-[82vh]">
          <EditorialImage
            src={homepageImages.session5}
            alt="A black membership card with the gold GA monogram resting on leather"
            position="object-[center_48%]"
          />
        </div>

        <div className="flex min-w-0 flex-col justify-center px-6 py-12 sm:px-10 lg:px-16 lg:py-24">
          <Reveal>
            <h2 className="break-words font-display text-[26px] font-medium leading-[1.1] text-[#FCFAF7] sm:text-[32px] lg:text-[36px] xl:text-[40px]">
              <span className="block">MEMBERSHIP</span>
              <span className="block">IS PERSONAL.</span>
            </h2>

            <p className="mt-5 max-w-[28rem] text-sm leading-[1.85] text-[#B5AEA3]">
              Membership is arranged through management after your request has been reviewed.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <ol className="mt-6 max-w-[34rem]">
              {MEMBERSHIP_STEPS.map((item) => (
                <li key={item.title} className="border-t border-white/12 py-4 last:border-b">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#FCFAF7]">
                    {item.title}
                  </p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-[#B5AEA3]">{item.copy}</p>
                </li>
              ))}
            </ol>

            <div className="mt-6">
              <EditorialCta to="/dashboard/membership" tone="dark">
                Discuss membership
              </EditorialCta>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
