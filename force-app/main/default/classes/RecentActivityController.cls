public with sharing class RecentActivityController {

    public class ActivityRecord implements Comparable {
        @AuraEnabled public String Id {get; set;}
        @AuraEnabled public String Name {get; set;}
        @AuraEnabled public String Type {get; set;}
        @AuraEnabled public String Status {get; set;}
        @AuraEnabled public String ObjectType {get; set;}
        @AuraEnabled public DateTime LastModifiedDate {get; set;}
        @AuraEnabled public String RelatedName {get; set;}
        @AuraEnabled public String Email {get; set;}
        @AuraEnabled public String Phone {get; set;}
        @AuraEnabled public Decimal Amount {get; set;}
        @AuraEnabled public Date CloseDate {get; set;}

        public Integer compareTo(Object compareTo) {
            ActivityRecord other = (ActivityRecord) compareTo;
            if (this.LastModifiedDate > other.LastModifiedDate) return -1;
            if (this.LastModifiedDate < other.LastModifiedDate) return 1;
            return 0;
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<ActivityRecord> getRecentActivities() {
        try {
            List<ActivityRecord> activities = new List<ActivityRecord>();

            // Get recent Opportunities
            List<Opportunity> opps = [
                SELECT Id, Name, Type, StageName, Amount, CloseDate,
                       LastModifiedDate, Account.Name
                FROM Opportunity
                WHERE LastModifiedDate = LAST_N_DAYS:30
                ORDER BY LastModifiedDate DESC
                LIMIT 5
            ];

            for (Opportunity opp : opps) {
                ActivityRecord activity = new ActivityRecord();
                activity.Id = opp.Id;
                activity.Name = opp.Name;
                activity.Type = opp.Type;
                activity.Status = opp.StageName;
                activity.ObjectType = 'Opportunity';
                activity.LastModifiedDate = opp.LastModifiedDate;
                activity.RelatedName = opp.Account?.Name;
                activity.Amount = opp.Amount;
                activity.CloseDate = opp.CloseDate;
                activities.add(activity);
            }

            // Get recent Leads
            List<Lead> leads = [
                SELECT Id, Name, Company, Status, Email, Phone,
                       LastModifiedDate
                FROM Lead
                WHERE LastModifiedDate = LAST_N_DAYS:30
                ORDER BY LastModifiedDate DESC
                LIMIT 5
            ];

            for (Lead lead : leads) {
                ActivityRecord activity = new ActivityRecord();
                activity.Id = lead.Id;
                activity.Name = lead.Name;
                activity.Type = lead.Company;
                activity.Status = lead.Status;
                activity.ObjectType = 'Lead';
                activity.LastModifiedDate = lead.LastModifiedDate;
                activity.Email = lead.Email;
                activity.Phone = lead.Phone;
                activities.add(activity);
            }

            // Get recent Accounts
            List<Account> accounts = [
                SELECT Id, Name, Type, Industry, Phone,
                       LastModifiedDate
                FROM Account
                WHERE LastModifiedDate = LAST_N_DAYS:30
                ORDER BY LastModifiedDate DESC
                LIMIT 5
            ];

            for (Account acc : accounts) {
                ActivityRecord activity = new ActivityRecord();
                activity.Id = acc.Id;
                activity.Name = acc.Name;
                activity.Type = acc.Type;
                activity.Status = acc.Industry;
                activity.ObjectType = 'Account';
                activity.LastModifiedDate = acc.LastModifiedDate;
                activity.Phone = acc.Phone;
                activities.add(activity);
            }

            // Sort all activities by LastModifiedDate
            activities.sort();
            return activities;

        } catch (Exception e) {
            throw new AuraHandledException('Error retrieving activities: ' + e.getMessage());
        }
    }
}
