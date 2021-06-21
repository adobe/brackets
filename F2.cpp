/*
     Author:Raghav Bansal
     IIIT Una
                  */
#include <bits/stdc++.h>
#define int long long int
#define mod 1000000007
#define pb push_back
#define mp make_pair
#define all(v) v.begin(),v.end()
#define BOLT ios_base::sync_with_stdio(false); cin.tie(NULL); cout.tie(NULL)
#define fil(a,val) memset(a,val,sizeof(a))
#define sz(a) sizeof(a)
#define X first
#define Y second
#define db double
#define MAX 1000001
#define endl "\n"
//#include <ext/pb_ds/assoc_container.hpp>
//#include <ext/pb_ds/tree_policy.hpp>
//#include <boost/multiprecision/cpp_int.hpp>
using namespace std;
typedef pair<int,int> pi;
typedef map<int,int> mii;
typedef vector<int> vec;
const db PI=acos(-1);
int n,a[200005];
int arr[200005];
//using namespace __gnu_pbds;
//template < typename T > using indexed_set = //tree < T, null_type, less < T >, rb_tree_tag, tree_order_statistics_node_update >;
//template < typename T > using MinPriorityQueue = priority_queue < T, vector < T >, greater < T > >;
//template < typename T > T getsum(int bit[],int r){T sum=0;while(r){sum+=bit[r]; r-=(r&(-r));}return sum; }
//template < typename T > void update(int bit[],int idx,int val){while(idx<=n){bit[idx]+=val; idx+=(idx&(-idx));}}
//template < typename T > T range(T l,T r){return getsum<int>(bit,r)-getsum<int>(bit,l-1);}
int powers[32];
vector<int> ans;
int pwr(int x,int y){
    int res=1;
    while(y>0)
    {
        if(y&1)
        res=res*x;
        y=y>>1;
        x=x*x;
    }
    return res;
}
void printSubsequences(int n) 
{ 
    for(int i=0;i<=10;i++)
    {
    	powers[i]=pwr(3,i);
	}
    unsigned int opsize = pow(2, 10); 
    for (int counter = 1; counter < opsize; counter++) 
    { 
        int ans1=0;
        for (int j = 0; j < n; j++) 
        { 
            if (counter & (1<<j)) 
                ans1+=powers[j]; 
        } 
        ans.pb(ans1);
    } 
} 
int32_t main(){
	BOLT;
	int t;
	printSubsequences(10ll);
	cin>>t;
	int i=1ll<<10; 
	sort(all(ans));
	while(t--)
	{
		int n;
		cin>>n; 
		cout<<ans[lower_bound(all(ans),n)-ans.begin()]<<endl;
	}
}
