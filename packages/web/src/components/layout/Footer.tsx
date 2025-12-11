// @ts-nocheck
import Link from 'next/link';
import { HeartIcon } from '@heroicons/react/24/outline';

export function Footer() {
  const navigation = {
    product: [
      { name: 'Recursos', href: '/features' },
      { name: 'Preços', href: '/pricing' },
      { name: 'Demonstração', href: '/demo' },
    ],
    support: [
      { name: 'Central de Ajuda', href: '/help' },
      { name: 'Contato', href: '/contact' },
      { name: 'Comunidade', href: '/community' },
    ],
    company: [
      { name: 'Sobre', href: '/about' },
      { name: 'Blog', href: '/blog' },
      { name: 'Carreiras', href: '/careers' },
    ],
    legal: [
      { name: 'Privacidade', href: '/privacy' },
      { name: 'Termos', href: '/terms' },
      { name: 'LGPD', href: '/lgpd' },
    ],
  };

  return (
    <footer className="bg-gray-900">
      <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 sm:pt-24 lg:px-8 lg:pt-32">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-[#00132d] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">V</span>
              </div>
              <span className="text-xl font-bold text-white">Vangarments</span>
            </Link>
            <p className="text-sm leading-6 text-gray-300">
              A plataforma brasileira que está revolucionando a forma como as pessoas
              se relacionam com a moda.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-white">Produto</h3>
                <ul className="mt-6 space-y-4">
                  {navigation.product.map((item) => (
                    <li key={item.name}>
                      <Link href={item.href} className="text-sm leading-6 text-gray-300 hover:text-[#fff7d7] transition-colors">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-white">Suporte</h3>
                <ul className="mt-6 space-y-4">
                  {navigation.support.map((item) => (
                    <li key={item.name}>
                      <Link href={item.href} className="text-sm leading-6 text-gray-300 hover:text-[#fff7d7] transition-colors">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-white">Empresa</h3>
                <ul className="mt-6 space-y-4">
                  {navigation.company.map((item) => (
                    <li key={item.name}>
                      <Link href={item.href} className="text-sm leading-6 text-gray-300 hover:text-[#fff7d7] transition-colors">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-white">Legal</h3>
                <ul className="mt-6 space-y-4">
                  {navigation.legal.map((item) => (
                    <li key={item.name}>
                      <Link href={item.href} className="text-sm leading-6 text-gray-300 hover:text-[#fff7d7] transition-colors">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-800 pt-8 md:flex md:items-center md:justify-between">
          <div className="flex space-x-6 md:order-2">
            <p className="text-xs leading-5 text-gray-400">
              Feito com <HeartIcon className="inline h-4 w-4 text-[#fff7d7]" /> no Brasil
            </p>
          </div>
          <p className="mt-8 text-xs leading-5 text-gray-400 md:order-1 md:mt-0">
            &copy; 2024 Vangarments. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}