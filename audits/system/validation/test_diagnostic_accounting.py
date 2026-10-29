"""Synthetic compatibility checks. No real supplement or admission decision is issued."""
from copy import deepcopy
import unittest

from diagnostic_accounting import CLASSIFICATION, OBLIGATIONS, PROTOCOL, SCOPE, account, digest


def fixture(consumer='REC'):
    """Invented evidence and actor identities; never authority for the existing commits."""
    actors = dict(producer='synthetic-producer', implementation_author='synthetic-implementer',
                  reviewer='synthetic-reviewer', consumer='synthetic-' + consumer)
    evidence = {name: ('SYNTHETIC ONLY: ' + name).encode() for name in
                (*OBLIGATIONS, 'protocol', 'owner', 'execution', 'consumer')}
    sources = [dict(id=name, path='synthetic/' + name, bytes=len(data), sha256=digest(data),
                    purpose='Synthetic compatibility fixture: ' + name) for name, data in evidence.items()]
    context = dict(protocol_sha256=digest(evidence['protocol']), owner_decision_sha256=digest(evidence['owner']),
                   execution_sha256=digest(evidence['execution']), consumer_sha256=digest(evidence['consumer']),
                   actors=actors, roots={'admin-ui': 'SYNTHETIC/admin-ui'}, evidence=evidence)
    bundle = {name: context[name] for name in
              ('protocol_sha256', 'owner_decision_sha256', 'consumer_sha256', 'execution_sha256', 'actors')}
    bundle.update(protocol=PROTOCOL, edition=1, prior_edition='NONE', current_authority='YES',
                  sources=sources, records=[], consumer_reviews={})
    entries = []
    for commit, (diag, candidate, parent, summary) in SCOPE.items():
        refs = {o: [dict(source=o, locator='synthetic obligation section')] for o in OBLIGATIONS}
        checks = {o: dict(result='PASS', reason='Synthetic independently reviewed obligation',
                          evidence_refs=deepcopy(refs[o])) for o in OBLIGATIONS}
        review = dict(actor=actors['reviewer'], date='2026-10-29', decision='ADMIT',
                      reason='Synthetic admission only', checks=checks)
        key = context['roots']['admin-ui'] + '|' + commit + '|' + diag
        record = dict(repository='admin-ui', root=context['roots']['admin-ui'], commit=commit,
                      parents=[parent], tree='a' * 40, summary=summary, diag_id=diag, candidate_id=candidate,
                      key=key, edition=1, prior_record='NONE', revocation='NONE', decision='ADMIT',
                      classification=CLASSIFICATION, original_formal_association='UNTRACED',
                      historical_unresolved_refs=['synthetic historical UNTRACED locator'],
                      rationale='Synthetic positive rationale compared to formal obligations',
                      limitations='Synthetic historical evidence; current verification UNVERIFIABLE',
                      gaps=[], evidence_refs=refs, review=review)
        bundle['records'].append(record)
        consumer_review = deepcopy(review)
        consumer_review.update(actor=actors['consumer'], reason='Separate synthetic consumer review')
        bundle['consumer_reviews'][key] = consumer_review
        entries.append({k: record[k] for k in ('repository', 'commit', 'parents', 'tree', 'summary')})
    return entries, bundle, context


def run_fixture(entries, bundle, context, consumer='REC'):
    mode = 'REMEDIATION_RECONCILIATION' if consumer == 'REC' else 'PHASE_3_RERUN'
    return account(entries, ['EA-XYZ-P3-T023'], consumer, mode, bundle, context, log_complete=True)


class LegacyCompatibility(unittest.TestCase):
    def test_exact_original_summary_only_with_many_to_many_edges(self):
        tickets = ['EA-XYZ-P2-T001', 'EA-XYZ-P3-T023', 'EA-XYZ-P3-T022']
        entries = [
            dict(repository='outer', commit='1' * 40, summary='EA-XYZ-P2-T001: one'),
            dict(repository='admin-ui', commit='2' * 40, summary='EA-XYZ-P2-T001 + EA-XYZ-P3-T023: shared'),
            dict(repository='admin-ui', commit='3' * 40, summary='XEA-XYZ-P3-T022 EA-XYZ-P3-T022-extra EA-XYZ-P3-T0220'),
        ]
        before = deepcopy(entries)
        result = account(entries, tickets, 'REC', 'REMEDIATION_RECONCILIATION', log_complete=True)
        self.assertEqual(result['ticket_states'], dict(zip(tickets, ['PROVENANCE_FOUND', 'PROVENANCE_FOUND', 'NO_PROVENANCE_FOUND'])))
        self.assertEqual(len(result['ticket_commits'][tickets[0]]), 2)
        self.assertEqual(result['rows'][1]['formal_tickets'], tickets[:2])
        self.assertEqual(result['unresolved_commits'], [('admin-ui', '3' * 40)])
        self.assertEqual(entries, before)

    def test_no_supplement_keeps_diagnostics_untraced(self):
        entries, _, _ = fixture()
        result = account(entries, ['EA-XYZ-P3-T023'], 'REC', 'REMEDIATION_RECONCILIATION', log_complete=True)
        self.assertEqual(len(result['unresolved_commits']), 3)
        self.assertTrue(all(r['classification'] == 'NOT_ESTABLISHED' for r in result['rows']))
        self.assertEqual(result['ticket_states']['EA-XYZ-P3-T023'], 'NO_PROVENANCE_FOUND')

    def test_incomplete_or_duplicate_log_rejected(self):
        entries, bundle, context = fixture()
        with self.assertRaises(ValueError):
            account(entries, [], 'REC', 'REMEDIATION_RECONCILIATION', bundle, context)
        with self.assertRaises(ValueError):
            run_fixture(entries + entries[:1], bundle, context)


class DiagnosticAccounting(unittest.TestCase):
    def test_independent_consumers_and_formal_axis(self):
        for consumer in ('REC', 'TRACE'):
            with self.subTest(consumer=consumer):
                entries, bundle, context = fixture(consumer)
                before = deepcopy((entries, bundle, context))
                result = run_fixture(entries, bundle, context, consumer)
                self.assertEqual(result['diagnostic_errors'], [])
                self.assertEqual(result['unresolved_commits'], [])
                self.assertTrue(all(r['accounting'] == CLASSIFICATION and r['original_formal_association'] == 'UNTRACED' for r in result['rows']))
                self.assertEqual(result['ticket_states']['EA-XYZ-P3-T023'], 'NO_PROVENANCE_FOUND')
                self.assertEqual((entries, bundle, context), before)

    def test_individual_reject_unresolved_and_consumer_refusal(self):
        for consumer in ('REC', 'TRACE'):
            entries, bundle, context = fixture(consumer)
            for record, decision in zip(bundle['records'][1:], ('REJECT', 'UNRESOLVED')):
                record.update(decision=decision, classification='NOT_ESTABLISHED', gaps=['synthetic reason'])
                record['review']['decision'] = decision
                record['review']['checks']['original_authorization']['result'] = 'FAIL'
                bundle['consumer_reviews'][record['key']]['decision'] = decision
            result = run_fixture(entries, bundle, context, consumer)
            self.assertEqual(result['diagnostic_errors'], [])
            self.assertEqual([r['classification'] for r in result['rows']], [CLASSIFICATION, 'NOT_ESTABLISHED', 'NOT_ESTABLISHED'])
            self.assertEqual(result['diagnostic_consumer_effect'], 'INCOMPLETE')
            first = bundle['records'][0]
            bundle['consumer_reviews'][first['key']]['decision'] = 'UNRESOLVED'
            self.assertEqual(len(run_fixture(entries, bundle, context, consumer)['unresolved_commits']), 3)

    def test_negative_evidence_and_authority_cases(self):
        def bad_seal(e, b, c):
            c['evidence']['original_authorization'] = b'tampered'

        def bad_actor(e, b, c):
            b['actors']['reviewer'] = b['actors']['producer']

        def missing_consumer(e, b, c):
            b['consumer_reviews'].clear()

        mutations = {
            'missing original authorization': lambda e, b, c: b['records'][0]['evidence_refs'].pop('original_authorization'),
            'invalid source seal': bad_seal,
            'unknown source': lambda e, b, c: b['records'][0]['evidence_refs']['sealed_evidence'][0].update(source='unlisted'),
            'missing source bytes': lambda e, b, c: c['evidence'].pop('immutable_identity'),
            'missing owner source': lambda e, b, c: b.update(sources=[s for s in b['sources'] if s['id'] != 'owner']),
            'stale protocol': lambda e, b, c: b.update(protocol_sha256='0' * 64),
            'stale consumer edition': lambda e, b, c: b.update(consumer_sha256='0' * 64),
            'missing later execution': lambda e, b, c: c.pop('execution_sha256'),
            'self reviewer': bad_actor,
            'unappointed producer': lambda e, b, c: b.update(actors={**b['actors'], 'producer': 'other'}),
            'revocation': lambda e, b, c: b['records'][0].update(revocation='synthetic revocation'),
            'stale authority': lambda e, b, c: b.update(current_authority='NO'),
            'changed summary': lambda e, b, c: b['records'][0].update(summary='renamed'),
            'wrong direct parent': lambda e, b, c: b['records'][0].update(parents=['0' * 40]),
            'wrong tree': lambda e, b, c: b['records'][0].update(tree='b' * 40),
            'wrong root': lambda e, b, c: b['records'][0].update(root='other/admin-ui'),
            'candidate identity conflict': lambda e, b, c: b['records'][0].update(candidate_id='CAND-DCR-999'),
            'out of scope commit': lambda e, b, c: b['records'][0].update(commit='0' * 40),
            'orphan record': lambda e, b, c: e.pop(),
            'duplicate record': lambda e, b, c: b['records'].append(deepcopy(b['records'][0])),
            'missing candidate': lambda e, b, c: b['records'].pop(),
            'missing consumer validation': missing_consumer,
            'positive decision with material gap': lambda e, b, c: b['records'][0].update(gaps=['missing evidence']),
            'invented formal association': lambda e, b, c: b['records'][0].update(original_formal_association='EA-XYZ-P3-T023'),
            'missing historical unresolved': lambda e, b, c: b['records'][0].update(historical_unresolved_refs=[]),
            'missing rationale': lambda e, b, c: b['records'][0].update(rationale=''),
            'missing obligation': lambda e, b, c: b['records'][0]['review']['checks'].pop('nonfinding_rationale'),
            'failed admission check': lambda e, b, c: b['records'][0]['review']['checks']['formal_nonduplication'].update(result='FAIL'),
            'failed consumer check': lambda e, b, c: b['consumer_reviews'][b['records'][0]['key']]['checks']['continuity'].update(result='FAIL'),
            'missing edition ancestry': lambda e, b, c: b.update(edition=2),
            'malformed packet': lambda e, b, c: b.update(records=None),
        }
        for consumer in ('REC', 'TRACE'):
            for name, mutate in mutations.items():
                with self.subTest(consumer=consumer, negative_case=name):
                    entries, bundle, context = fixture(consumer)
                    mutate(entries, bundle, context)
                    result = run_fixture(entries, bundle, context, consumer)
                    self.assertTrue(result['diagnostic_errors'])
                    self.assertTrue(all(r['classification'] == 'NOT_ESTABLISHED' for r in result['rows']))
                    self.assertEqual(result['diagnostic_consumer_effect'], 'INCOMPLETE')

    def test_input_route_cannot_expand_other_modes(self):
        entries, bundle, context = fixture()
        for consumer, mode in [('REC', 'INITIAL'), ('REC', 'PHASE_3_CONTINUATION'), ('TRACE', 'INITIAL')]:
            with self.subTest(consumer=consumer, mode=mode), self.assertRaises(ValueError):
                account(entries, [], consumer, mode, bundle, context, log_complete=True)


if __name__ == '__main__':
    unittest.main(verbosity=2)
