import { Router, Request, Response } from 'express';
import { LGPDComplianceService } from '../services/lgpdComplianceService';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { validateConsent, auditLogger, cpfValidation } from '../middleware/security';
import { body, query, param } from 'express-validator';

const router = Router();
const lgpdService = new LGPDComplianceService();

// Consent Management Routes

/**
 * Record user consent (LGPD Article 8)
 */
router.post(
  '/consent',
  authenticateToken,
  auditLogger('record_consent'),
  [
    body('consentType').isIn(['data_processing', 'marketing', 'analytics', 'cookies', 'third_party_sharing']),
    body('consentGiven').isBoolean(),
    body('purpose').isString().isLength({ min: 10, max: 500 }),
    body('dataCategories').isArray({ min: 1 }),
    body('legalBasis').isIn(['consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests']),
    body('retentionPeriod').isString(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const consentData = {
        ...req.body,
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.get('User-Agent') || 'unknown',
      };

      const consent = await lgpdService.recordConsent(userId, consentData);

      res.status(201).json({
        success: true,
        data: consent,
        message: 'Consent recorded successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error?.message || 'Failed to record consent',
      });
    }
  }
);

/**
 * Withdraw consent (LGPD Article 8, §5º)
 */
router.post(
  '/consent/withdraw',
  authenticateToken,
  auditLogger('withdraw_consent'),
  [body('consentType').isIn(['data_processing', 'marketing', 'analytics', 'cookies', 'third_party_sharing'])],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { consentType } = req.body;
      const ipAddress = req.ip || '127.0.0.1';
      const userAgent = req.get('User-Agent') || 'unknown';

      await lgpdService.withdrawConsent(userId, consentType, ipAddress, userAgent);

      res.json({
        success: true,
        message: 'Consent withdrawn successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error?.message || 'Failed to withdraw consent',
      });
    }
  }
);

/**
 * Get user consents
 */
router.get(
  '/consent',
  authenticateToken,
  auditLogger('view_consents'),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const consents = await lgpdService.getUserConsents(userId);

      res.json({
        success: true,
        data: consents,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to get consents',
      });
    }
  }
);

// Data Subject Rights Routes (LGPD Articles 18-22)

/**
 * Create data subject request
 */
router.post(
  '/data-subject-request',
  authenticateToken,
  auditLogger('create_data_subject_request'),
  [
    body('requestType').isIn(['access', 'rectification', 'erasure', 'portability', 'restriction', 'objection']),
    body('requestDetails').isString().isLength({ min: 10, max: 1000 }),
    body('verificationMethod').isString(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const requestData = req.body;

      const request = await lgpdService.createDataSubjectRequest(userId, requestData);

      res.status(201).json({
        success: true,
        data: request,
        message: 'Data subject request created successfully. We will process it within 15 days as required by LGPD.',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error?.message || 'Failed to create data subject request',
      });
    }
  }
);

/**
 * Request data access (LGPD Article 18, II)
 */
router.post(
  '/data-access-request',
  authenticateToken,
  auditLogger('request_data_access'),
  [body('verificationMethod').isString()],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { verificationMethod } = req.body;

      const request = await lgpdService.createDataSubjectRequest(userId, {
        requestType: 'access',
        requestDetails: 'User requested access to all personal data processed by Vangarments',
        verificationMethod,
      });

      res.status(201).json({
        success: true,
        data: request,
        message: 'Data access request submitted. You will receive your data within 15 days.',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error?.message || 'Failed to create data access request',
      });
    }
  }
);

/**
 * Request data erasure (LGPD Article 18, VI)
 */
router.post(
  '/data-erasure-request',
  authenticateToken,
  auditLogger('request_data_erasure'),
  [
    body('verificationMethod').isString(),
    body('reason').isString().isLength({ min: 10, max: 500 }),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { verificationMethod, reason } = req.body;

      const request = await lgpdService.createDataSubjectRequest(userId, {
        requestType: 'erasure',
        requestDetails: `User requested data erasure. Reason: ${reason}`,
        verificationMethod,
      });

      res.status(201).json({
        success: true,
        data: request,
        message: 'Data erasure request submitted. We will review and process it within 15 days.',
        warning: 'Please note that some data may be retained for legal obligations or legitimate interests.',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error?.message || 'Failed to create data erasure request',
      });
    }
  }
);

/**
 * Request data portability (LGPD Article 18, V)
 */
router.post(
  '/data-portability-request',
  authenticateToken,
  auditLogger('request_data_portability'),
  [body('verificationMethod').isString()],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { verificationMethod } = req.body;

      const request = await lgpdService.createDataSubjectRequest(userId, {
        requestType: 'portability',
        requestDetails: 'User requested data portability in structured, machine-readable format',
        verificationMethod,
      });

      res.status(201).json({
        success: true,
        data: request,
        message: 'Data portability request submitted. You will receive your data in JSON format within 15 days.',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error?.message || 'Failed to create data portability request',
      });
    }
  }
);

/**
 * Get privacy policy information
 */
router.get(
  '/privacy-policy',
  async (req: Request, res: Response) => {
    try {
      const privacyInfo = {
        dataController: {
          name: 'Vangarments Ltd',
          cnpj: '00.000.000/0001-00', // Would be real CNPJ
          address: 'Sao Paulo, SP, Brazil',
          email: 'privacy@vangarments.com',
          dpo: 'dpo@vangarments.com',
        },
        dataProcessing: {
          purposes: [
            'Provide fashion cataloging and social platform services',
            'Process marketplace transactions',
            'Improve AI models and recommendations',
            'Comply with legal obligations',
            'Prevent fraud and ensure security',
          ],
          legalBases: [
            'User consent (LGPD Article 7)',
            'Contract performance (LGPD Article 7, V)',
            'Legal obligation (LGPD Article 7, II)',
            'Legitimate interests (LGPD Article 7, IX)',
          ],
          dataCategories: [
            'Identity data (name, CPF, email)',
            'Contact data (phone, address)',
            'Fashion preferences and wardrobe data',
            'Usage and behavioral data',
            'Transaction and payment data',
            'Social media integration data',
          ],
          retentionPeriods: {
            'user_profile': '5 years after account closure',
            'wardrobe_data': '3 years after last activity',
            'transaction_data': '10 years (legal requirement)',
            'marketing_data': '2 years or until consent withdrawal',
            'analytics_data': '2 years in anonymized form',
          },
        },
        userRights: [
          'Access your personal data (Article 18, II)',
          'Correct incomplete or inaccurate data (Article 18, III)',
          'Anonymize, block or delete data (Article 18, IV and VI)',
          'Data portability (Article 18, V)',
          'Information about data sharing (Article 18, VII)',
          'Withdraw consent (Article 8, §5º)',
          'Object to processing (Article 18, §2º)',
        ],
        contact: {
          email: 'privacy@vangarments.com',
          phone: '+55 11 9999-9999',
          address: 'Sao Paulo, SP, Brazil',
          responseTime: '15 days maximum (LGPD Article 19)',
        },
        lastUpdated: '2024-01-01T00:00:00Z',
        version: '1.0',
      };

      res.json({
        success: true,
        data: privacyInfo,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to get privacy policy',
      });
    }
  }
);

export default router;