/**
 * Brazilian address utilities including CEP validation and formatting
 */

export interface BrazilianAddress {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  number: string;
  complement?: string;
}

export class AddressUtils {
  /**
   * Validates Brazilian CEP (postal code) format
   */
  static isValidCEP(cep: string): boolean {
    const cleanCEP = cep.replace(/[^\d]/g, '');
    return cleanCEP.length === 8 && /^\d{8}$/.test(cleanCEP);
  }

  /**
   * Formats CEP with standard Brazilian formatting
   */
  static formatCEP(cep: string): string {
    const cleanCEP = cep.replace(/[^\d]/g, '');
    if (!this.isValidCEP(cleanCEP)) {
      throw new Error('Invalid CEP format');
    }
    return cleanCEP.replace(/(\d{5})(\d{3})/, '$1-$2');
  }

  /**
   * Removes formatting from CEP
   */
  static cleanCEP(cep: string): string {
    return cep.replace(/[^\d]/g, '');
  }

  /**
   * Validates complete Brazilian address
   */
  static validateAddress(address: Partial<BrazilianAddress>): string[] {
    const errors: string[] = [];

    if (!address.cep || !this.isValidCEP(address.cep)) {
      errors.push('Valid postal code is required');
    }

    if (!address.state || address.state.length !== 2) {
      errors.push('Valid state code (2 letters) is required');
    }

    if (!address.city || address.city.trim().length < 2) {
      errors.push('City name is required');
    }

    if (!address.neighborhood || address.neighborhood.trim().length < 2) {
      errors.push('Neighborhood is required');
    }

    if (!address.street || address.street.trim().length < 5) {
      errors.push('Street address is required');
    }

    if (!address.number || address.number.trim().length < 1) {
      errors.push('Address number is required');
    }

    return errors;
  }

  /**
   * Brazilian states with their codes
   */
  static readonly STATES = {
    'AC': 'Acre',
    'AL': 'Alagoas',
    'AP': 'Amapa',
    'AM': 'Amazonas',
    'BA': 'Bahia',
    'CE': 'Ceara',
    'DF': 'Federal District',
    'ES': 'Espirito Santo',
    'GO': 'Goias',
    'MA': 'Maranhao',
    'MT': 'Mato Grosso',
    'MS': 'Mato Grosso do Sul',
    'MG': 'Minas Gerais',
    'PA': 'Para',
    'PB': 'Paraiba',
    'PR': 'Parana',
    'PE': 'Pernambuco',
    'PI': 'Piaui',
    'RJ': 'Rio de Janeiro',
    'RN': 'Rio Grande do Norte',
    'RS': 'Rio Grande do Sul',
    'RO': 'Rondonia',
    'RR': 'Roraima',
    'SC': 'Santa Catarina',
    'SP': 'Sao Paulo',
    'SE': 'Sergipe',
    'TO': 'Tocantins'
  };

  static isValidState(stateCode: string): boolean {
    return stateCode.toUpperCase() in this.STATES;
  }
}