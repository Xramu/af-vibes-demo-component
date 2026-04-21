import { LightningElement, wire } from 'lwc';
import getRecentActivities from '@salesforce/apex/RecentActivityController.getRecentActivities';

export default class RecentActivityFeed extends LightningElement {
    activities = [];
    error;
    isLoading = true;

    @wire(getRecentActivities)
    wiredActivities({ error, data }) {
        this.isLoading = false;
        if (data) {
            this.activities = data.map(activity => {
                return {
                    ...activity,
                    iconName: this.getIconForObjectType(activity.ObjectType),
                    statusBadgeClass: this.getBadgeClass(activity.Status, activity.ObjectType),
                    timeAgo: this.getTimeAgo(activity.LastModifiedDate),
                    formattedAmount: this.formatCurrency(activity.Amount),
                    formattedCloseDate: this.formatDate(activity.CloseDate),
                    recordLink: `/${activity.Id}`,
                    displayType: activity.Type || activity.ObjectType,
                    Status: activity.Status || activity.ObjectType,
                    // Show different details based on object type
                    isOpportunity: activity.ObjectType === 'Opportunity',
                    isLead: activity.ObjectType === 'Lead',
                    isAccount: activity.ObjectType === 'Account',
                };
            });
            this.error = undefined;
        } else if (error) {
            this.error = 'Error loading activities: ' + (error.body?.message || error.message);
            this.activities = [];
        }
    }

    get hasActivities() {
        return this.activities && this.activities.length > 0;
    }

    getIconForObjectType(objectType) {
        const iconMap = {
            'Opportunity': 'standard:opportunity',
            'Lead': 'standard:lead',
            'Account': 'standard:account'
        };
        return iconMap[objectType] || 'standard:feed';
    }

    getBadgeClass(status, objectType) {
        if (!status) return 'badge-info';

        const lowerStatus = status.toLowerCase();

        // Opportunity stages
        if (objectType === 'Opportunity') {
            if (lowerStatus.includes('closed won') || lowerStatus.includes('won')) {
                return 'badge-success';
            } else if (lowerStatus.includes('closed lost') || lowerStatus.includes('lost')) {
                return 'badge-error';
            } else if (lowerStatus.includes('negotiation') || lowerStatus.includes('proposal')) {
                return 'badge-warning';
            }
        }

        // Lead statuses
        if (objectType === 'Lead') {
            if (lowerStatus.includes('qualified') || lowerStatus.includes('converted')) {
                return 'badge-success';
            } else if (lowerStatus.includes('unqualified')) {
                return 'badge-error';
            } else if (lowerStatus.includes('working') || lowerStatus.includes('contacted')) {
                return 'badge-warning';
            }
        }

        return 'badge-info';
    }

    getTimeAgo(dateString) {
        if (!dateString) return '';

        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now - date;
        const diffInMins = Math.floor(diffInMs / 60000);
        const diffInHours = Math.floor(diffInMs / 3600000);
        const diffInDays = Math.floor(diffInMs / 86400000);

        if (diffInMins < 1) return 'Just now';
        if (diffInMins < 60) return `${diffInMins}m ago`;
        if (diffInHours < 24) return `${diffInHours}h ago`;
        if (diffInDays < 7) return `${diffInDays}d ago`;
        if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
        return date.toLocaleDateString();
    }

    formatCurrency(amount) {
        if (!amount && amount !== 0) return 'N/A';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }
}
